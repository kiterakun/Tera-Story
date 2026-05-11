import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Relationship } from '../models/Relationship';
import { ConsequenceSeed } from '../models/ConsequenceSeed';

const router = Router();

function getPlaythroughModel() {
  return (
    mongoose.models['Playthrough'] ||
    mongoose.model('Playthrough', new mongoose.Schema({}, { strict: false }))
  );
}

// GET /api/playthroughs/:playthroughId/relationships
router.get(
  '/playthroughs/:playthroughId/relationships',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;

      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(playthroughId).lean();
      if (!playthrough) { res.status(404).json({ error: 'Playthrough not found' }); return; }
      if ((playthrough as Record<string, unknown>).userId?.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

      const relationships = await Relationship.find({ playthroughId })
        .populate('characterA', 'name')
        .populate('characterB', 'name')
        .lean();

      // Transform for frontend: include character names
      const result = relationships.map((r) => ({
        _id: r._id,
        characterA: { _id: (r.characterA as { _id?: unknown; name?: string })?._id, name: (r.characterA as { _id?: unknown; name?: string })?.name },
        characterB: { _id: (r.characterB as { _id?: unknown; name?: string })?._id, name: (r.characterB as { _id?: unknown; name?: string })?.name },
        type: r.type,
        intensity: r.intensity,
      }));

      res.json({ relationships: result });
    } catch (err) {
      console.error('List relationships error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/playthroughs/:playthroughId/consequences
router.get(
  '/playthroughs/:playthroughId/consequences',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;

      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(playthroughId).lean();
      if (!playthrough) { res.status(404).json({ error: 'Playthrough not found' }); return; }
      if ((playthrough as Record<string, unknown>).userId?.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

      const consequences = await ConsequenceSeed.find({ playthroughId })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ consequences });
    } catch (err) {
      console.error('List consequences error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
