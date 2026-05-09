import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Character } from '../models/Character';
import { initializeDynamicStats } from '../services/characterService';
import { queueImageGeneration } from '../services/imageService';

const router = Router();

// Safe model access — Playthrough may be created by a parallel task (T11)
function getPlaythroughModel() {
  return (
    mongoose.models['Playthrough'] ||
    mongoose.model('Playthrough', new mongoose.Schema({}, { strict: false }))
  );
}

// GET /api/playthroughs/:playthroughId/characters — list characters for a playthrough
router.get(
  '/playthroughs/:playthroughId/characters',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;

      // Verify user owns the playthrough
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

      const characters = await Character.find({ playthroughId }).lean();
      res.json({ characters });
    } catch (err) {
      console.error('List characters error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/playthroughs/:playthroughId/characters — create character
router.post(
  '/playthroughs/:playthroughId/characters',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;
      const { name, role, description } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      if (!role || !['protagonist', 'npc'].includes(role)) {
        res.status(400).json({ error: 'Role must be "protagonist" or "npc"' });
        return;
      }

      // Get worldId from Playthrough
      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(playthroughId).lean();

      if (!playthrough) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }

      const ptObj = playthrough as Record<string, unknown>;

      if (ptObj.userId?.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const worldId = ptObj.worldId as mongoose.Types.ObjectId;

      if (!worldId) {
        res.status(400).json({ error: 'Playthrough has no associated world' });
        return;
      }

      // Initialize dynamic stats from world templates
      const dynamicStats = await initializeDynamicStats(worldId.toString());

      const character = await Character.create({
        name: name.trim(),
        description: description || '',
        role,
        playthroughId,
        worldId,
        userId,
        dynamicStats,
      });

      // Fire-and-forget image generation
      queueImageGeneration(
        { name: name.trim(), description: description || 'A mysterious character in a story world' },
        'character',
        character._id.toString(),
        worldId.toString(),
        userId
      );


      res.status(201).json({ character });
    } catch (err) {
      console.error('Create character error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/characters/:id — get single character
router.get(
  '/characters/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const character = await Character.findById(id).lean();

      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }

      if (character.userId.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.json({ character });
    } catch (err) {
      console.error('Get character error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/characters/:id — update name, description, imageUrl only
router.put(
  '/characters/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, imageUrl } = req.body;

      const character = await Character.findById(id).lean();

      if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
      }

      if (character.userId.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Only allow updating name, description, imageUrl — NOT stats
      const update: Record<string, unknown> = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (imageUrl !== undefined) update.imageUrl = imageUrl;

      const updated = await Character.findByIdAndUpdate(
        id,
        { $set: update },
        { returnDocument: 'after' }
      ).lean();

      res.json({ character: updated });
    } catch (err) {
      console.error('Update character error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
