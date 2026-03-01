import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { Playthrough } from '../models/Playthrough';
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

      if (!['character', 'item', 'special-item'].includes(entityType)) {
        res.status(400).json({ error: 'Invalid entityType' });
        return;
      }

      let prompt: string;

      if (entityType === 'character') {
        const char = await Character.findById(entityId).lean();
        if (!char) { res.status(404).json({ error: 'Character not found' }); return; }
        if (char.userId.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
        prompt = `Character portrait, close-up bust shot facing the viewer: ${char.name}. ${char.description || 'A mysterious character'}. Highly detailed digital painting, painterly style, dramatic lighting, RPG character illustration. No text, no watermark, no frame.`;
      } else if (entityType === 'item') {
        const item = await Item.findById(entityId).lean();
        if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
        const pt = await Playthrough.findById(item.playthroughId).lean();
        if (!pt || pt.userId.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
        prompt = `Single item illustration, centered on dark background: ${item.name} — ${item.description}. ${item.rarity || 'common'} tier quality. Detailed digital painting, RPG inventory icon style, dramatic lighting, no text, no watermark, no hands.`;
      } else {
        // special-item
        const si = await SpecialItem.findById(entityId).lean();
        if (!si) { res.status(404).json({ error: 'Special item not found' }); return; }
        const pt = await Playthrough.findById(si.playthroughId).lean();
        if (!pt || pt.userId.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
        prompt = `Magical ability icon, centered glowing effect on dark background: ${si.name} — ${si.description}. Category: ${si.category}, ${si.rarity || 'common'} tier. Ethereal digital art, mystical energy visualization, RPG skill icon style, no text, no watermark.`;
      }

      queueImageGeneration(prompt, entityType, entityId, userId);
      res.json({ message: 'Image generation queued' });
    } catch (err) {
      console.error('Image regenerate error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
