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

      const items = await Item.find({ playthroughId }).sort({ createdAt: -1 }).lean();
      res.json({ items });
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

export default router;
