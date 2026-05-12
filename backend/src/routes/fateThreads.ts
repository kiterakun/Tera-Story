import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Playthrough } from '../models/Playthrough';
import { buildFateThreadsGraph, peekGhostThread } from '../services/fateThreadsService';
import type { PeekRequest } from '../types/fateThreads.types';

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

// GET /api/playthroughs/:playthroughId/threads
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const graph = await buildFateThreadsGraph(playthroughId as string, userId);

    res.json({
      status: 'success',
      data: graph,
    });
  } catch (err) {
    console.error('Fate threads graph error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/playthroughs/:playthroughId/threads/peek
router.post('/peek', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;
    const { currentChapterId, choiceIndex, language } = req.body as {
      currentChapterId?: string;
      choiceIndex?: number;
      language?: 'en' | 'vi';
    };

    if (!currentChapterId || choiceIndex === undefined || !language) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: currentChapterId, choiceIndex, language',
      });
      return;
    }

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const peekReq: PeekRequest & { userId: string } = {
      playthroughId: playthroughId as string,
      currentChapterId,
      choiceIndex,
      language: language as 'en' | 'vi',
      userId,
    };

    const result = await peekGhostThread(peekReq);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    console.error('Peek ghost thread error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
