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
    req.on('close', () => abortController.abort());

    activeGenerations.add(playthroughId);
    try {
      const result = await generateChapter(
        playthroughId,
        choice,
        userId,
        abortController.signal
      );
      result.pipeTextStreamToResponse(res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Generation failed' });
      }
    } finally {
      // Remove after stream ends — listen to finish/error events
      res.on('finish', () => activeGenerations.delete(playthroughId));
      res.on('error', () => activeGenerations.delete(playthroughId));
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

      // Latest chapter in current arc
      const latestChapter = currentArc
        ? await Chapter.findOne({ arcId: currentArc._id })
            .sort({ chapterIndex: -1 })
            .lean()
        : null;

      // Protagonist
      const protagonist = await Character.findOne({
        playthroughId,
        role: 'protagonist',
      }).lean();

      res.json({
        playthrough,
        currentArc,
        latestChapter,
        choices: latestChapter?.choices ?? [],
        protagonist,
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
