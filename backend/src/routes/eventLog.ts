import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Playthrough } from '../models/Playthrough';
import { listEvents, deleteEvent, deleteAllEvents } from '../services/eventLogService';

const router = Router();

async function verifyOwnership(
  playthroughId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) return { ok: false, status: 404, error: 'Playthrough not found' };
  if (playthrough.userId.toString() !== userId) return { ok: false, status: 403, error: 'Unauthorized' };
  return { ok: true };
}

// GET /api/playthroughs/:playthroughId/events
router.get(
  '/playthroughs/:playthroughId/events',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const playthroughId = req.params.playthroughId as string;

      const ownership = await verifyOwnership(playthroughId, userId);
      if (!ownership.ok) {
        res.status(ownership.status).json({ error: ownership.error });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const severity = (req.query.severity as string) || undefined;
      const type = (req.query.type as string) || undefined;

      const result = await listEvents(playthroughId, {
        page,
        limit,
        severity: severity as import('../services/eventLogService').ListEventsOptions['severity'],
        type: type as import('../services/eventLogService').ListEventsOptions['type'],
      });

      res.json({
        success: true,
        events: result.events,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      });
    } catch (err: unknown) {
      console.error('[EventLog] List events error:', err);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  }
);

// DELETE /api/playthroughs/:playthroughId/events
router.delete(
  '/playthroughs/:playthroughId/events',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const playthroughId = req.params.playthroughId as string;

      const ownership = await verifyOwnership(playthroughId, userId);
      if (!ownership.ok) {
        res.status(ownership.status).json({ error: ownership.error });
        return;
      }

      const deletedCount = await deleteAllEvents(playthroughId, userId);
      res.json({ success: true, deletedCount });
    } catch (err: unknown) {
      console.error('[EventLog] Delete all events error:', err);
      res.status(500).json({ error: 'Failed to delete events' });
    }
  }
);

// DELETE /api/events/:eventId
router.delete(
  '/events/:eventId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const eventId = req.params.eventId as string;

      const deleted = await deleteEvent(eventId, userId);
      if (!deleted) {
        res.status(404).json({ error: 'Event not found or unauthorized' });
        return;
      }

      res.json({ success: true });
    } catch (err: unknown) {
      console.error('[EventLog] Delete event error:', err);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  }
);

export default router;
