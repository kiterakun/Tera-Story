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

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const type = req.query.type as LeaderboardType | undefined;
    if (!type) {
      res.status(400).json({ status: 'error', message: `Missing type. Valid: ${VALID_TYPES.join(', ')}` });
      return;
    }
    await handleLeaderboardRequest(req, res, type);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/leaderboard/:type?scope=friends&period=weekly
router.get('/:type', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const type = req.params.type as LeaderboardType;
    await handleLeaderboardRequest(req, res, type);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

function normalizePeriod(value: unknown): LeaderboardPeriod {
  if (value === 'this_week') return 'weekly';
  if (value === 'all_time') return 'alltime';
  return (value as LeaderboardPeriod) || 'alltime';
}

async function handleLeaderboardRequest(req: AuthRequest, res: Response, type: LeaderboardType): Promise<void> {
  const userId = req.user!.id;
  const scope = (req.query.scope as LeaderboardScope) || 'global';
  const period = normalizePeriod(req.query.period);

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
}

export default router;
