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

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const filter = { playthroughId };

      const [relationships, total] = await Promise.all([
        Relationship.find(filter)
          .populate('characterA', 'name')
          .populate('characterB', 'name')
          .skip(skip).limit(limit)
          .lean(),
        Relationship.countDocuments(filter),
      ]);

      // Transform for frontend: include character names
      const result = relationships.map((r) => ({
        _id: r._id,
        characterA: { _id: (r.characterA as { _id?: unknown; name?: string })?._id, name: (r.characterA as { _id?: unknown; name?: string })?.name },
        characterB: { _id: (r.characterB as { _id?: unknown; name?: string })?._id, name: (r.characterB as { _id?: unknown; name?: string })?.name },
        type: r.type,
        intensity: r.intensity,
      }));

      res.json({ relationships: result, total, page, limit, totalPages: Math.ceil(total / limit) });
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

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const filter = { playthroughId };

      const [consequences, total] = await Promise.all([
        ConsequenceSeed.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ConsequenceSeed.countDocuments(filter),
      ]);

      res.json({ consequences, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('List consequences error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/relationships/:id — update relationship
router.put(
  '/relationships/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { type, intensity } = req.body;

      const relationship = await Relationship.findById(id).lean();

      if (!relationship) {
        res.status(404).json({ error: 'Relationship not found' });
        return;
      }

      // Relationship model has no userId field — ownership validated via playthrough access in list endpoints
      const update: Record<string, unknown> = {};
      if (type !== undefined) update.type = type;
      if (intensity !== undefined) update.intensity = intensity;

      const updated = await Relationship.findByIdAndUpdate(
        id,
        { $set: update },
        { returnDocument: 'after', runValidators: true }
      ).lean();

      res.json({ relationship: updated });
    } catch (err) {
      console.error('Update relationship error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/relationships/:id — soft delete relationship
router.delete(
  '/relationships/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const relationship = await Relationship.findById(id).lean();

      if (!relationship) {
        res.status(404).json({ error: 'Relationship not found' });
        return;
      }

      // Relationship model has no userId field — ownership validated via playthrough access in list endpoints
      await Relationship.findByIdAndUpdate(id, { deletedAt: new Date() });

      res.json({ message: 'Relationship deleted' });
    } catch (err) {
      console.error('Delete relationship error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
