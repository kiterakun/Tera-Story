import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Echo } from '../models/Echo';
import { Playthrough } from '../models/Playthrough';
import type { EchoStatus } from '../models/Echo';

const router = Router({ mergeParams: true });

// --- Validation Schemas ---

const resolveEchoSchema = z.object({
  narrative: z.string().min(1, 'Narrative is required').max(5000),
});

const updateEchoStatusSchema = z.object({
  status: z.enum(['planted', 'approaching', 'active', 'resolved']),
});

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

// GET /api/playthroughs/:playthroughId/echoes
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const status = req.query.status as EchoStatus | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const filter: Record<string, unknown> = { playthroughId };
    if (status) {
      filter.status = status;
    }

    const [echoes, total] = await Promise.all([
      Echo.find(filter)
        .sort({ triggerChapterIndex: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Echo.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { echoes, total, limit, offset },
    });
  } catch (err) {
    console.error('List echoes error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/playthroughs/:playthroughId/echoes/pending
router.get('/pending', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const echoes = await Echo.find({
      playthroughId,
      status: { $ne: 'resolved' },
    })
      .select('type description triggerChapterIndex targetChapterIndex status minChapterDelay')
      .sort({ targetChapterIndex: 1 })
      .lean();

    res.json({
      status: 'success',
      data: { echoes },
    });
  } catch (err) {
    console.error('List pending echoes error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/playthroughs/:playthroughId/echoes/upcoming
router.get('/upcoming', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;
    const ahead = Math.max(1, Math.min(20, parseInt(req.query.ahead as string) || 5));

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const playthrough = await Playthrough.findById(playthroughId).lean();
    const currentChapterIndex = playthrough!.currentArcIndex;
    const targetIndex = currentChapterIndex + ahead;

    const echoes = await Echo.find({
      playthroughId,
      status: { $ne: 'resolved' },
      targetChapterIndex: { $lte: targetIndex },
    })
      .select('type description triggerChapterIndex targetChapterIndex status')
      .sort({ targetChapterIndex: 1 })
      .lean();

    res.json({
      status: 'success',
      data: { echoes, currentChapterIndex },
    });
  } catch (err) {
    console.error('List upcoming echoes error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/playthroughs/:playthroughId/echoes/:echoId
router.get('/:echoId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId, echoId } = req.params;

    if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

    const echo = await Echo.findOne({ _id: echoId, playthroughId }).lean();

    if (!echo) {
      res.status(404).json({ status: 'error', message: 'Echo not found' });
      return;
    }

    res.json({ status: 'success', data: { echo } });
  } catch (err) {
    console.error('Get echo error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/playthroughs/:playthroughId/echoes/:echoId/resolve
router.post(
  '/:echoId/resolve',
  validate(resolveEchoSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId, echoId } = req.params;

      if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

      const echo = await Echo.findOneAndUpdate(
        { _id: echoId, playthroughId },
        {
          $set: {
            status: 'resolved' as EchoStatus,
            narrative: (req.body as { narrative: string }).narrative,
            resolvedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!echo) {
        res.status(404).json({ status: 'error', message: 'Echo not found' });
        return;
      }

      await Playthrough.findByIdAndUpdate(playthroughId, {
        $inc: { echoesResolvedCount: 1 },
      });

      res.json({
        status: 'success',
        data: { echo },
      });
    } catch (err) {
      console.error('Resolve echo error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// PATCH /api/playthroughs/:playthroughId/echoes/:echoId/resolve
router.patch(
  '/:echoId/resolve',
  validate(resolveEchoSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId, echoId } = req.params;

      if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

      const echo = await Echo.findOneAndUpdate(
        { _id: echoId, playthroughId },
        {
          $set: {
            status: 'resolved' as EchoStatus,
            narrative: (req.body as { narrative: string }).narrative,
            resolvedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!echo) {
        res.status(404).json({ status: 'error', message: 'Echo not found' });
        return;
      }

      // Increment echo resolved count on playthrough
      await Playthrough.findByIdAndUpdate(playthroughId, {
        $inc: { echoesResolvedCount: 1 },
      });

      res.json({
        status: 'success',
        data: { echo },
      });
    } catch (err) {
      console.error('Resolve echo error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

// PATCH /api/playthroughs/:playthroughId/echoes/:echoId/status
router.patch(
  '/:echoId/status',
  validate(updateEchoStatusSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId, echoId } = req.params;

      if (!(await verifyOwnership(playthroughId as string, userId, res))) return;

      const echo = await Echo.findOneAndUpdate(
        { _id: echoId, playthroughId },
        {
          $set: {
            status: (req.body as { status: EchoStatus }).status,
          },
        },
        { returnDocument: 'after' }
      );

      if (!echo) {
        res.status(404).json({ status: 'error', message: 'Echo not found' });
        return;
      }

      res.json({
        status: 'success',
        data: { echo },
      });
    } catch (err) {
      console.error('Update echo status error:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
);

export default router;
