import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

const VISIBILITIES = ['public', 'friends', 'private'] as const;

const updatePrivacySchema = z
  .object({
    profileVisibility: z.enum(VISIBILITIES).optional(),
    storyVisibility: z.enum(VISIBILITIES).optional(),
    achievementVisibility: z.enum(VISIBILITIES).optional(),
    allowFriendRequests: z.boolean().optional(),
    showOnLeaderboard: z.boolean().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'No valid privacy settings provided',
  });

router.use(authMiddleware);

// GET /api/user/privacy - Get privacy settings
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId).select('privacySettings').lean();
    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }
    res.json({ status: 'success', data: { privacySettings: user.privacySettings } });
  } catch (err) {
    logger.error({ err }, 'Get privacy error:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// PUT /api/user/privacy - Update privacy settings
router.put('/', validate(updatePrivacySchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updates: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(req.body as z.infer<typeof updatePrivacySchema>)) {
      updates[`privacySettings.${field}`] = value;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { returnDocument: 'after' }
    ).select('privacySettings').lean();

    if (!user) {
      res.status(404).json({ status: 'error', message: 'User not found' });
      return;
    }

    res.json({ status: 'success', data: { privacySettings: user.privacySettings } });
  } catch (err) {
    logger.error({ err }, 'Update privacy error:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
