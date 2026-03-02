import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateChapter, retryChapter, retryChapterTools } from '../services/storyOrchestrator';
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
    } catch (err: any) {
      console.error('[Story] Generation error:', err);
      res.status(500).json({ error: err.message || 'Generation failed' });
    } finally {
      activeGenerations.delete(playthroughId);
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
    } catch (err: any) {
      console.error('[Story] Retry error:', err);
      res.status(500).json({ error: err.message || 'Retry failed' });
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
    } catch (err: any) {
      console.error('[Story] Retry tools error:', err);
      res.status(500).json({ error: err.message || 'Retry tools failed' });
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

      // ALL chapters for this playthrough (for chapter navigation)
      // Only show completed chapters (not generating/failed ones unless it's the latest)
      const chapters = await Chapter.find({ playthroughId })
        .sort({ chapterIndex: 1 })
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
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || 'Failed to fetch story state' });
    }
  }
);

export default router;
