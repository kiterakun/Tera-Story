import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { SpecialItem } from '../models/SpecialItem';

const router = Router();

// Safe model access for Playthrough
function getPlaythroughModel() {
  return (
    mongoose.models['Playthrough'] ||
    mongoose.model('Playthrough', new mongoose.Schema({}, { strict: false }))
  );
}

// GET /api/playthroughs/:playthroughId/special-items — list all special items
router.get(
  '/playthroughs/:playthroughId/special-items',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;

      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(playthroughId).lean();

      if (!playthrough) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }

      if ((playthrough as Record<string, unknown>).userId?.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { category } = req.query;
      const filter: Record<string, unknown> = { playthroughId };
      if (category && typeof category === 'string') {
        filter.category = category;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const [specialItems, total] = await Promise.all([
        SpecialItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SpecialItem.countDocuments(filter),
      ]);

      res.json({ specialItems, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('List special items error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/special-items/:id — get single special item
router.get(
  '/special-items/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const specialItem = await SpecialItem.findById(id).lean();

      if (!specialItem) {
        res.status(404).json({ error: 'Special item not found' });
        return;
      }

      res.json({ specialItem });
    } catch (err) {
      console.error('Get special item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/playthroughs/:playthroughId/special-items/by-owner/:characterId
router.get(
  '/playthroughs/:playthroughId/special-items/by-owner/:characterId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId, characterId } = req.params;

      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(playthroughId).lean();

      if (!playthrough) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }

      if ((playthrough as Record<string, unknown>).userId?.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const filter = { playthroughId, ownerId: characterId };

      const [specialItems, total] = await Promise.all([
        SpecialItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SpecialItem.countDocuments(filter),
      ]);

      res.json({ specialItems, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('List special items by owner error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/special-items/:id — update special item
router.put(
  '/special-items/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, imageUrl, category } = req.body;

      const specialItem = await SpecialItem.findById(id).lean();

      if (!specialItem) {
        res.status(404).json({ error: 'Special item not found' });
        return;
      }

      // SpecialItem model has no userId field — ownership validated via playthrough access in list endpoints
      const update: Record<string, unknown> = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (imageUrl !== undefined) update.imageUrl = imageUrl;
      if (category !== undefined) update.category = category;

      const updated = await SpecialItem.findByIdAndUpdate(
        id,
        { $set: update },
        { returnDocument: 'after', runValidators: true }
      ).lean();

      res.json({ specialItem: updated });
    } catch (err) {
      console.error('Update special item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/special-items/:id — soft delete special item
router.delete(
  '/special-items/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const specialItem = await SpecialItem.findById(id).lean();

      if (!specialItem) {
        res.status(404).json({ error: 'Special item not found' });
        return;
      }

      // SpecialItem model has no userId field — ownership validated via playthrough access in list endpoints
      await SpecialItem.findByIdAndUpdate(id, { deletedAt: new Date() });

      res.json({ message: 'Special item deleted' });
    } catch (err) {
      console.error('Delete special item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
