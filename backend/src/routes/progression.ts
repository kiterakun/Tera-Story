import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  addXp,
  getUserProgress,
  getLevelHistory,
  XP_REWARDS,
  LEVEL_TITLES,
  xpRequiredForLevel,
} from '../services/progressionService';
import type { XpSource } from '../models/User';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// --- Validation Schemas ---

const addXpSchema = z.object({
  amount: z.number().positive('XP amount must be positive'),
  source: z.enum([
    'scene_complete',
    'choice_made',
    'combat_win',
    'achievement_unlock',
    'playthrough_complete',
    'daily_login',
  ]),
  metadata: z
    .object({
      playthroughId: z.string().optional(),
      sceneId: z.string().optional(),
      achievementKey: z.string().optional(),
    })
    .optional(),
});

// --- Routes ---

// GET /api/user/progress
router.get('/progress', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const progress = await getUserProgress(userId);

    res.json({
      status: 'success',
      data: progress,
    });
  } catch (err) {
    console.error('Get user progress error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/user/xp
router.post(
  '/xp',
  validate(addXpSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { amount, source, metadata } = req.body as {
        amount: number;
        source: XpSource;
        metadata?: { playthroughId?: string; sceneId?: string; achievementKey?: string };
      };

      const result = await addXp(userId, amount, source, metadata);

      res.json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'User not found') {
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }
      console.error('Add XP error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// GET /api/user/level-history
router.get('/level-history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const history = await getLevelHistory(userId, limit);

    res.json({
      status: 'success',
      data: { history },
    });
  } catch (err) {
    console.error('Get level history error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/user/xp-reference
router.get('/xp-reference', (_req: AuthRequest, res: Response): void => {
  res.json({
    status: 'success',
    data: {
      rewards: XP_REWARDS,
      titles: LEVEL_TITLES,
      levelCurve: Array.from({ length: 10 }, (_, i) => ({
        level: i + 1,
        xpToNext: xpRequiredForLevel(i + 1),
      })),
    },
  });
});

export default router;
