import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';
import { queueImageGeneration } from '../services/imageService';

const router = Router();

// POST /api/images/regenerate — re-queue image generation for an entity
router.post(
  '/regenerate',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { entityType, entityId } = req.body;

      if (!entityType || !entityId) {
        res.status(400).json({ error: 'entityType and entityId are required' });
        return;
      }

      if (!['character', 'item', 'special-item', 'world'].includes(entityType)) {
        res.status(400).json({ error: 'Invalid entityType' });
        return;
      }

      if (entityType === 'character') {
        const char = await Character.findById(entityId).lean();
        if (!char) { res.status(404).json({ error: 'Character not found' }); return; }
        if (char.userId.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
        queueImageGeneration(
          { name: char.name, description: char.description || 'A mysterious character' },
          'character',
          entityId,
          char.worldId.toString(),
          userId
        );
      } else if (entityType === 'item') {
        const item = await Item.findById(entityId).lean();
        if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
        const pt = await Playthrough.findById(item.playthroughId).lean();
        if (!pt || pt.userId.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
        queueImageGeneration(
          { name: item.name, description: item.description, rarity: item.rarity },
          'item',
          entityId,
          pt.worldId.toString(),
          userId
        );
      } else if (entityType === 'world') {
        const world = await World.findById(entityId).lean();
        if (!world) { res.status(404).json({ error: 'World not found' }); return; }
        if (world.userId.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
        queueImageGeneration(
          { name: world.name, description: world.description || 'A mysterious world' },
          'world',
          entityId,
          entityId, // world IS the worldId
          userId
        );
      } else {
        // special-item
        const si = await SpecialItem.findById(entityId).lean();
        if (!si) { res.status(404).json({ error: 'Special item not found' }); return; }
        const pt = await Playthrough.findById(si.playthroughId).lean();
        if (!pt || pt.userId.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
        queueImageGeneration(
          { name: si.name, description: si.description, rarity: si.rarity, category: si.category },
          'special-item',
          entityId,
          pt.worldId.toString(),
          userId
        );
      }

      res.json({ message: 'Image generation queued' });
    } catch (err) {
      console.error('Image regenerate error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
