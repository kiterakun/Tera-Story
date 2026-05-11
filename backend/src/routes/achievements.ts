import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Achievement } from '../models/Achievement';
import { UserAchievement } from '../models/UserAchievement';
import { checkAchievements, getAchievements, getRecentAchievements } from '../services/achievementService';

const router = Router();

// --- Validation Schemas ---

const checkSchema = z.object({
  userId: z.string(),
  event: z.object({
    type: z.enum([
      'scene_completed',
      'choice_made',
      'combat_won',
      'card_unlocked',
      'playthrough_completed',
      'enemy_spared',
      'secret_discovered',
    ]),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
});

// --- Routes ---

// GET /api/achievements - List all achievements with user progress
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await getAchievements(userId, {
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
      rarity: req.query.rarity as string | undefined,
    });

    res.json({ status: 'success', data: result });
  } catch (err) {
    console.error('List achievements error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/achievements/recent - Recent unlocks
router.get('/recent', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const recent = await getRecentAchievements(userId);
    res.json({ status: 'success', data: { recent } });
  } catch (err) {
    console.error('Recent achievements error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/achievements/:key - Single achievement detail
router.get('/:key', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;

    const achievement = await Achievement.findOne({ key }).lean();
    if (!achievement) {
      res.status(404).json({ status: 'error', message: 'Achievement not found' });
      return;
    }

    const userProgress = await UserAchievement.findOne({ userId, achievementKey: key }).lean();

    res.json({
      status: 'success',
      data: {
        achievement,
        userProgress: userProgress
          ? {
              unlocked: !!userProgress.unlockedAt,
              unlockedAt: userProgress.unlockedAt,
              progress: userProgress.progress,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('Achievement detail error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/achievements/check - Check and unlock achievements (internal)
router.post(
  '/check',
  validate(checkSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, event } = req.body;

      const result = await checkAchievements(userId, event);

      res.json({
        status: 'success',
        data: {
          unlocked: result.unlocked,
          progressUpdated: result.progressUpdated,
        },
      });
    } catch (err) {
      console.error('Check achievements error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

export default router;
