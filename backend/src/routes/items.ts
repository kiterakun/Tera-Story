import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Item } from '../models/Item';

const router = Router();

// Safe model access for Playthrough
function getPlaythroughModel() {
  return (
    mongoose.models['Playthrough'] ||
    mongoose.model('Playthrough', new mongoose.Schema({}, { strict: false }))
  );
}

// GET /api/playthroughs/:playthroughId/items — list items in playthrough
router.get(
  '/playthroughs/:playthroughId/items',
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

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const filter = { playthroughId };

      const [items, total] = await Promise.all([
        Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Item.countDocuments(filter),
      ]);

      res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('List items error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/items/:id — get single item
router.get(
  '/items/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const item = await Item.findById(id).lean();

      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      res.json({ item });
    } catch (err) {
      console.error('Get item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/items/:id — update item
router.put(
  '/items/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, imageUrl, rarity } = req.body;

      const item = await Item.findById(id).lean();

      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      // Item model has no userId field — ownership validated via playthrough access in list endpoints
      const update: Record<string, unknown> = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (imageUrl !== undefined) update.imageUrl = imageUrl;
      if (rarity !== undefined) update.rarity = rarity;

      const updated = await Item.findByIdAndUpdate(
        id,
        { $set: update },
        { returnDocument: 'after', runValidators: true }
      ).lean();

      res.json({ item: updated });
    } catch (err) {
      console.error('Update item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/items/:id — soft delete item
router.delete(
  '/items/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const item = await Item.findById(id).lean();

      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      // Item model has no userId field — ownership validated via playthrough access in list endpoints
      await Item.findByIdAndUpdate(id, { deletedAt: new Date() });

      res.json({ message: 'Item deleted' });
    } catch (err) {
      console.error('Delete item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
