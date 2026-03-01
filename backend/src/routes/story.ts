import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateChapter } from '../services/storyOrchestrator';
import { Arc } from '../models/Arc';
import { Chapter } from '../models/Chapter';
import { Character } from '../models/Character';
import { Playthrough } from '../models/Playthrough';

const router = Router();

// In-memory concurrency guard
const activeGenerations = new Set<string>();

// POST /api/story/generate
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

    const abortController = new AbortController();
    // Abort when CLIENT disconnects (res 'close'), NOT when request body is consumed (req 'close').
    res.on('close', () => { if (!res.writableFinished) abortController.abort(); });

    activeGenerations.add(playthroughId);
    try {
      const { stream } = await generateChapter(
        playthroughId,
        choice,
        userId,
        abortController.signal
      );
      stream.pipeTextStreamToResponse(res);
      // CRITICAL: await stream completion so async errors are caught by this try/catch.
      // Without this, pipeTextStreamToResponse returns void immediately and the
      // try block exits — any provider/streaming error is silently swallowed.
      await stream.text;
    } catch (err: any) {
      console.error('[Story] Generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Generation failed' });
      }
    } finally {
      activeGenerations.delete(playthroughId);
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

      // Recent chapters (last 5 across all arcs for this playthrough)
      const chapters = await Chapter.find({ playthroughId })
        .sort({ chapterIndex: -1 })
        .limit(5)
        .lean();
      chapters.reverse();

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
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || 'Failed to fetch story state' });
    }
  }
);

export default router;
