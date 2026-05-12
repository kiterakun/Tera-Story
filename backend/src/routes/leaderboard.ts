import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  getLeaderboard,
  LeaderboardType,
  LeaderboardScope,
  LeaderboardPeriod,
} from '../services/leaderboardService';

const router = Router();

router.use(authMiddleware);

const VALID_TYPES: LeaderboardType[] = ['scenes', 'achievements', 'streak', 'cards'];
const VALID_SCOPES: LeaderboardScope[] = ['friends', 'global'];
const VALID_PERIODS: LeaderboardPeriod[] = ['weekly', 'alltime'];

// GET /api/leaderboard/:type?scope=friends&period=weekly
router.get('/:type', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const type = req.params.type as LeaderboardType;
    const scope = (req.query.scope as LeaderboardScope) || 'global';
    const period = (req.query.period as LeaderboardPeriod) || 'alltime';

    if (!VALID_TYPES.includes(type)) {
      res.status(400).json({ status: 'error', message: `Invalid type. Valid: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (!VALID_SCOPES.includes(scope)) {
      res.status(400).json({ status: 'error', message: `Invalid scope. Valid: ${VALID_SCOPES.join(', ')}` });
      return;
    }
    if (!VALID_PERIODS.includes(period)) {
      res.status(400).json({ status: 'error', message: `Invalid period. Valid: ${VALID_PERIODS.join(', ')}` });
      return;
    }

    const result = await getLeaderboard(type, scope, period, userId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
