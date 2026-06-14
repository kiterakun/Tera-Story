/**
 * Share + export routes for /api/v1/*:
 *  - POST /api/v1/playthroughs/:id/share → mint a share token
 *  - GET  /api/v1/share/:token           → public snapshot (no auth)
 *  - GET  /api/v1/share/:token/meta      → token metadata (view count, expiry)
 *  - POST /api/v1/playthroughs/:id/export → PDF / Markdown / ePub
 *
 * The share endpoint is rate-limited 10 views/IP/hour to deter scraping.
 */

import { Router, Response, Request } from 'express';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Playthrough, IPlaythroughDocument } from '../models/Playthrough';
import { Chapter } from '../models/Chapter';
import { World } from '../models/World';
import { User } from '../models/User';
import { ShareToken, type IShareTokenDocument } from '../models/ShareToken';
import { logger } from '../utils/logger';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';

const router = Router();

const playthroughIdParam = z.object({
  id: z.string().refine((s) => mongoose.Types.ObjectId.isValid(s), { message: 'Invalid id' }),
});

const tokenParam = z.object({
  token: z.string().min(20).max(128),
});

const exportSchema = z.object({
  format: z.enum(['pdf', 'md', 'epub']),
});

const SHARE_TTL_DAYS = 30;
const SHARE_TTL_MS = SHARE_TTL_DAYS * 24 * 60 * 60 * 1000;

function generateToken(): string {
  // URL-safe base64 of 32 random bytes ≈ 43 chars
  return randomBytes(32).toString('base64url');
}

const shareReadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many share views, please try again later' },
});

interface SnapshotPayload {
  name: string;
  worldName: string;
  worldId: string;
  status: 'active' | 'paused' | 'completed';
  completedAt: string | null;
  chapters: Array<{ index: number; title: string; content: string }>;
  owner: { username: string; displayName?: string };
  sharedAt: string;
  expiresAt: string;
}

async function buildSnapshot(
  playthrough: IPlaythroughDocument,
  token: IShareTokenDocument,
): Promise<SnapshotPayload> {
  const [world, chapters, owner] = await Promise.all([
    World.findById(playthrough.worldId).select('name').lean(),
    Chapter.find({ playthroughId: playthrough._id })
      .sort({ chapterIndex: 1 })
      .select('chapterIndex content')
      .lean(),
    User.findById(playthrough.userId).select('username displayName privacySettings').lean(),
  ]);
  const isPublic = owner?.privacySettings?.storyVisibility === 'public';
  return {
    name: playthrough.name,
    worldName: world?.name ?? 'Unknown world',
    worldId: playthrough.worldId.toString(),
    status: playthrough.status,
    completedAt: playthrough.completedAt ? playthrough.completedAt.toISOString() : null,
    chapters: chapters.map((c) => ({
      index: c.chapterIndex,
      title: `Chapter ${c.chapterIndex + 1}`,
      content: c.content,
    })),
    owner: {
      username: owner?.username ?? 'Unknown',
      ...(isPublic && owner?.displayName ? { displayName: owner.displayName } : {}),
    },
    sharedAt: token.createdAt.toISOString(),
    expiresAt: token.expiresAt.toISOString(),
  };
}

// POST /api/v1/playthroughs/:id/share
router.post(
  '/:id/share',
  authMiddleware,
  validate(playthroughIdParam, 'params'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as z.infer<typeof playthroughIdParam>;
      const userId = req.user!.id;
      const pt = await Playthrough.findOne({ _id: id, userId, deletedAt: null }).select('_id').lean();
      if (!pt) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }
      const token = generateToken();
      const doc = await ShareToken.create({
        token,
        playthroughId: pt._id,
        userId,
        expiresAt: new Date(Date.now() + SHARE_TTL_MS),
        viewCount: 0,
      });
      res.json({ success: true, data: { token, expiresAt: doc.expiresAt.toISOString() } });
    } catch (err) {
      logger.error({ err }, 'Mint share token error');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/v1/share/token/:token — public snapshot (no auth)
router.get(
  '/token/:token',
  shareReadLimiter,
  validate(tokenParam, 'params'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params as z.infer<typeof tokenParam>;
      const doc = await ShareToken.findOneAndUpdate(
        { token, expiresAt: { $gt: new Date() } },
        { $inc: { viewCount: 1 } },
        { returnDocument: 'after' },
      );
      if (!doc) {
        res.status(404).json({ error: 'Share link not found or expired' });
        return;
      }
      const pt = await Playthrough.findById(doc.playthroughId).lean();
      if (!pt || pt.deletedAt) {
        res.status(404).json({ error: 'Playthrough no longer available' });
        return;
      }
      const snapshot = await buildSnapshot(pt, doc);
      res.json({ success: true, data: snapshot });
    } catch (err) {
      logger.error({ err }, 'Get shared snapshot error');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/v1/playthroughs/:id/export
router.post(
  '/:id/export',
  authMiddleware,
  validate(playthroughIdParam, 'params'),
  validate(exportSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as z.infer<typeof playthroughIdParam>;
      const { format } = req.body as z.infer<typeof exportSchema>;
      const userId = req.user!.id;
      const pt = await Playthrough.findOne({ _id: id, userId, deletedAt: null }).lean();
      if (!pt) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }
      // Build a one-shot share token for public rendering.
      const token = generateToken();
      const doc = await ShareToken.create({
        token,
        playthroughId: pt._id,
        userId,
        expiresAt: new Date(Date.now() + SHARE_TTL_MS),
        viewCount: 0,
      });
      const snapshot = await buildSnapshot(pt, doc);
      const safeName = (snapshot.name || 'playthrough').replace(/[^A-Za-z0-9-_]+/g, '_').slice(0, 64);

      if (format === 'md') {
        const md = renderMarkdown(snapshot);
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.md"`);
        res.send(md);
        return;
      }

      if (format === 'pdf') {
        const buf = await renderPdf(snapshot);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(buf);
        return;
      }

      // epub
      const buf = await renderEpub(snapshot);
      res.setHeader('Content-Type', 'application/epub+zip');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.epub"`);
      res.send(buf);
    } catch (err) {
      logger.error({ err }, 'Export playthrough error');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

function renderMarkdown(s: SnapshotPayload): string {
  const lines: string[] = [];
  lines.push(`# ${s.name}`);
  lines.push('');
  lines.push(`*World: ${s.worldName}*`);
  lines.push(`*Status: ${s.status}*`);
  if (s.completedAt) lines.push(`*Completed: ${s.completedAt}*`);
  lines.push(`*By: ${s.owner.displayName ?? s.owner.username}*`);
  lines.push('');
  lines.push('## Table of Contents');
  s.chapters.forEach((c) => lines.push(`- Chapter ${c.index + 1}: ${c.title}`));
  lines.push('');
  for (const c of s.chapters) {
    lines.push(`## Chapter ${c.index + 1}: ${c.title}`);
    lines.push('');
    // Use marked to render the content to HTML, but for .md export we keep markdown
    lines.push(c.content);
    lines.push('');
  }
  return lines.join('\n');
}

async function renderPdf(s: SnapshotPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (b) => chunks.push(b));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cover
    doc.fontSize(28).text(s.name, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(s.worldName, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).fillColor('gray').text('Tera-Story', { align: 'center' });
    doc.fillColor('black');
    doc.addPage();

    // TOC
    doc.fontSize(18).text('Table of Contents');
    doc.moveDown();
    s.chapters.forEach((c) => {
      doc.fontSize(11).text(`Chapter ${c.index + 1}: ${c.title}`);
    });
    doc.addPage();

    // Chapters
    for (const c of s.chapters) {
      doc.fontSize(16).text(`Chapter ${c.index + 1}: ${c.title}`);
      doc.moveDown();
      doc.fontSize(11).text(c.content, { align: 'justify' });
      doc.addPage();
    }

    doc.end();
  });
}

async function renderEpub(s: SnapshotPayload): Promise<Buffer> {
  // epub-gen-memory exposes a default function that returns a Promise<Buffer>.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const epubGen = require('epub-gen-memory');
  const epubFactory = epubGen.default ?? epubGen;
  const htmlChapters = s.chapters.map((c) => ({
    title: `Chapter ${c.index + 1}: ${c.title}`,
    content: marked.parse(c.content) as string,
  }));
  const buf: Buffer = await epubFactory({
    title: s.name,
    author: s.owner.displayName ?? s.owner.username,
    publisher: 'Tera-Story',
    content: htmlChapters,
  });
  return buf;
}

export default router;
