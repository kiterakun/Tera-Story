import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  AlreadyClaimedError,
  QuestAlreadyClaimedError,
  QuestNotCompletedError,
  QuestNotFoundError,
  QuestNotOwnedError,
  claimDaily,
  claimQuest,
  generateDailyQuests,
  getDailyStatus,
  updateQuestProgress,
} from '../services/dailyService';

const router = Router();

// --- Validation Schemas ---

const questProgressSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  questType: z.enum([
    'read_scenes',
    'make_choices',
    'win_combat',
    'unlock_achievement',
    'collect_card',
  ]),
  increment: z.number().int().positive().max(100).default(1),
});

// --- Routes ---

// GET /api/daily/status
router.get(
  '/status',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      await generateDailyQuests(userId);
      const data = await getDailyStatus(userId);

      res.json({ status: 'success', data });
    } catch (err) {
      console.error('Get daily status error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// POST /api/daily/claim
router.post(
  '/claim',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data = await claimDaily(userId);

      res.json({ status: 'success', data });
    } catch (err) {
      if (err instanceof AlreadyClaimedError) {
        res.status(400).json({ status: 'error', message: err.message });
        return;
      }

      console.error('Claim daily error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// POST /api/daily/quest/:questId/claim
router.post(
  '/quest/:questId/claim',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { questId } = req.params;
      const data = await claimQuest(userId, questId as string);

      res.json({ status: 'success', data });
    } catch (err) {
      if (err instanceof QuestNotCompletedError) {
        res.status(400).json({ status: 'error', message: err.message });
        return;
      }

      if (err instanceof QuestAlreadyClaimedError) {
        res.status(409).json({ status: 'error', message: err.message });
        return;
      }

      if (err instanceof QuestNotFoundError) {
        res.status(404).json({ status: 'error', message: err.message });
        return;
      }

      if (err instanceof QuestNotOwnedError) {
        res.status(403).json({ status: 'error', message: 'Access denied' });
        return;
      }

      console.error('Claim daily quest error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// POST /api/daily/quest/progress - Internal route for storyOrchestrator
router.post(
  '/quest/progress',
  validate(questProgressSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, questType, increment } = req.body as z.infer<
        typeof questProgressSchema
      >;

      const data = await updateQuestProgress(userId, questType, increment);

      res.json({ status: 'success', data });
    } catch (err) {
      console.error('Update daily quest progress error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

export default router;
