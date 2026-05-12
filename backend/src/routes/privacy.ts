import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

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
    console.error('Get privacy error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// PUT /api/user/privacy - Update privacy settings
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updates: Record<string, unknown> = {};

    const allowedFields = ['profileVisibility', 'storyVisibility', 'achievementVisibility', 'allowFriendRequests', 'showOnLeaderboard'] as const;
    const validVisibilities = ['public', 'friends', 'private'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const prefix = `privacySettings.${field}`;
        if (field === 'allowFriendRequests' || field === 'showOnLeaderboard') {
          if (typeof req.body[field] !== 'boolean') {
            res.status(400).json({ status: 'error', message: `${field} must be a boolean` });
            return;
          }
          updates[prefix] = req.body[field];
        } else {
          if (typeof req.body[field] !== 'string' || !validVisibilities.includes(req.body[field])) {
            res.status(400).json({ status: 'error', message: `${field} must be one of: ${validVisibilities.join(', ')}` });
            return;
          }
          updates[prefix] = req.body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ status: 'error', message: 'No valid privacy settings provided' });
      return;
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
    console.error('Update privacy error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
