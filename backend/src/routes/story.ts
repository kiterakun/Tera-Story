import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateChapter, generateChapterStream, retryChapter, retryChapterTools, summarizeCurrentArc } from '../services/storyOrchestrator';
import { Arc } from '../models/Arc';
import { Chapter } from '../models/Chapter';
import { Character } from '../models/Character';
import { Playthrough } from '../models/Playthrough';

const router = Router();

// In-memory concurrency guard
const activeGenerations = new Set<string>();

// POST /api/story/generate — full JSON response (no streaming)
router.post(
  '/story/generate',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { playthroughId, choice } = req.body;
    const userId = req.user!.id;

    if (!playthroughId || !choice) {
      res.status(400).json({ error: 'playthroughId and choice are required' });
      return;
    }

    if (activeGenerations.has(playthroughId)) {
      res
        .status(429)
        .json({ error: 'Generation already in progress for this playthrough' });
      return;
    }

    activeGenerations.add(playthroughId);
    try {
      const result = await generateChapter(
        playthroughId,
        choice,
        userId
      );

      res.json({
        success: true,
        chapter: result.chapter,
        content: result.content,
      });
    } catch (err: unknown) {
      console.error('[Story] Generation error:', err);
      const message = err instanceof Error ? err.message : 'Generation failed';
      res.status(500).json({ error: message });
    } finally {
      activeGenerations.delete(playthroughId);
    }
  }
);

// POST /api/story/generate-stream — SSE streaming endpoint
router.post(
  '/story/generate-stream',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { playthroughId, choice } = req.body;
    const userId = req.user!.id;

    if (!playthroughId || !choice) {
      res.status(400).json({ error: 'playthroughId and choice are required' });
      return;
    }

    if (activeGenerations.has(playthroughId)) {
      res.status(429).json({ error: 'Generation already in progress for this playthrough' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    activeGenerations.add(playthroughId);

    // Handle client disconnect
    let clientDisconnected = false;
    req.on('close', () => { clientDisconnected = true; });

    const sendSSE = (event: string, data: unknown) => {
      if (clientDisconnected) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      // Use res.flush() if using compression middleware
      if (typeof (res as unknown as { flush?: () => void }).flush === 'function') {
        (res as unknown as { flush: () => void }).flush();
      }
    };
    
    // Immediately send a connected event to resolve the fetch promise and show progress
    sendSSE('phase', { phase: 'context', message: 'Analyzing world and story state...' });

    try {
      const result = await generateChapterStream(
        playthroughId,
        choice,
        userId,
        (token) => sendSSE('token', { token }),
        () => sendSSE('phase', { phase: 'tools', message: 'Updating game state...' }),
        () => sendSSE('phase', { phase: 'tools_complete', message: 'Game state updated' })
      );

      // Reload chapter to include choices and tool results
      const updatedChapter = await Chapter.findById(result.chapter?._id).lean();

      sendSSE('complete', {
        success: true,
        chapter: updatedChapter || result.chapter,
        content: result.content,
      });
    } catch (err: unknown) {
      console.error('[Story] Stream generation error:', err);
      const message = err instanceof Error ? err.message : 'Generation failed';
      sendSSE('error', { error: message });
    } finally {
      activeGenerations.delete(playthroughId);
      if (!clientDisconnected) res.end();
    }
  }
);

// POST /api/story/retry — retry a failed chapter generation
router.post(
  '/story/retry',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { chapterId } = req.body;
    const userId = req.user!.id;

    if (!chapterId) {
      res.status(400).json({ error: 'chapterId is required' });
      return;
    }

    try {
      const result = await retryChapter(chapterId, userId);

      res.json({
        success: true,
        chapter: result.chapter,
        content: result.content,
      });
    } catch (err: unknown) {
      console.error('[Story] Retry error:', err);
      const message = err instanceof Error ? err.message : 'Retry failed';
      res.status(500).json({ error: message });
    }
  }
);

// POST /api/story/retry-tools — retry only Pass 2 (tools) for a chapter with content OK
router.post(
  '/story/retry-tools',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { chapterId } = req.body;
    const userId = req.user!.id;

    if (!chapterId) {
      res.status(400).json({ error: 'chapterId is required' });
      return;
    }

    try {
      const result = await retryChapterTools(chapterId, userId);

      res.json({
        success: true,
        chapter: result.chapter,
        content: result.content,
      });
    } catch (err: unknown) {
      console.error('[Story] Retry tools error:', err);
      const message = err instanceof Error ? err.message : 'Retry tools failed';
      res.status(500).json({ error: message });
    }
  }
);

// GET /api/story/:playthroughId/state
router.get(
  '/story/:playthroughId/state',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const playthroughId = req.params.playthroughId as string;

      const playthrough = await Playthrough.findById(playthroughId).lean();
      if (!playthrough) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }
      if (playthrough.userId.toString() !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Current active arc
      const currentArc = await Arc.findOne({
        playthroughId,
        status: 'active',
      })
        .sort({ arcIndex: -1 })
        .lean();

      // ALL chapters for this playthrough, sorted chronologically (_id embeds timestamp)
      const chapters = await Chapter.find({ playthroughId })
        .sort({ _id: 1 })
        .lean();

      // Latest chapter for choices
      const latestChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;

      // Protagonist
      const protagonist = await Character.findOne({
        playthroughId,
        role: 'protagonist',
      }).lean();

      // Determine if this is a fresh start (no chapters yet)
      const isNewGame = chapters.length === 0;

      res.json({
        playthrough,
        currentArc,
        chapters,
        latestChapter,
        choices: latestChapter?.choices ?? [],
        protagonist,
        isNewGame,
        isGenerating: activeGenerations.has(playthroughId as string),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch story state';
      res
        .status(500)
        .json({ error: message });
    }
  }
);

// POST /api/story/summarize-arc — summarize current arc and start a new one
router.post(
  '/story/summarize-arc',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { playthroughId } = req.body;
    const userId = req.user!.id;

    if (!playthroughId) {
      res.status(400).json({ error: 'playthroughId is required' });
      return;
    }

    try {
      const result = await summarizeCurrentArc(playthroughId, userId);
      res.json({ success: true, ...result });
    } catch (err: unknown) {
      console.error('[Story] Summarize arc error:', err);
      const message = err instanceof Error ? err.message : 'Failed to summarize arc';
      res.status(500).json({ error: message });
    }
  }
);

export default router;
