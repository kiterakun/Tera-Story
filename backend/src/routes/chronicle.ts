import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Playthrough } from '../models/Playthrough';
import {
  getChronicle,
  generateChronicleCache,
  generateShareId,
  getChronicleStats,
} from '../services/chronicleService';

const router = Router({ mergeParams: true });

// --- Helpers ---

async function verifyOwnership(
  playthroughId: string,
  userId: string,
  res: Response
): Promise<boolean> {
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) {
    res.status(404).json({ status: 'error', message: 'Playthrough not found' });
    return false;
  }
  if (playthrough.userId.toString() !== userId) {
    res.status(403).json({ status: 'error', message: 'Access denied' });
    return false;
  }
  return true;
}

// --- Routes ---

// GET /api/playthroughs/:playthroughId/chronicle
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const forceRegenerate = req.query.forceRegenerate === 'true';
    const chronicle = await getChronicle(playthroughId as string, forceRegenerate);

    res.json({ status: 'success', data: chronicle });
  } catch (err) {
    console.error('Get chronicle error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/playthroughs/:playthroughId/chronicle/regenerate
router.post('/regenerate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    await generateChronicleCache(playthroughId as string);
    const chronicle = await getChronicle(playthroughId as string);

    res.json({ status: 'success', data: { chronicle } });
  } catch (err) {
    console.error('Regenerate chronicle error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/playthroughs/:playthroughId/chronicle/share
router.post('/share', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    // Generate if no shareId yet
    const playthrough = await Playthrough.findById(playthroughId as string).lean();
    if (!playthrough) {
      res.status(404).json({ status: 'error', message: 'Playthrough not found' });
      return;
    }

    const shareId = playthrough.shareId ?? (await generateShareId(playthroughId as string));

    res.json({
      status: 'success',
      data: { shareUrl: `/share/chronicle/${shareId}` },
    });
  } catch (err) {
    console.error('Share chronicle error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/playthroughs/:playthroughId/chronicle/stats
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const stats = await getChronicleStats(playthroughId as string);

    res.json({ status: 'success', data: stats });
  } catch (err) {
    console.error('Chronicle stats error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});


export default router;
