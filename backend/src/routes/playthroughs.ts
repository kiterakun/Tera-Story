import { Router, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';

const router = Router({ mergeParams: true });

// --- Validation Schemas ---

const createPlaythroughSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
});

const updatePlaythroughSchema = z.object({
  name: z.string().min(1).trim().optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
});

// --- Nested Routes (under /api/worlds/:worldId/playthroughs) ---

// GET /api/worlds/:worldId/playthroughs
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { worldId } = req.params;

    // Verify world exists and belongs to user
    const world = await World.findById(worldId);

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    if (world.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const playthroughs = await Playthrough.find({ worldId, userId }).sort({ updatedAt: -1 });

    res.json({ playthroughs });
  } catch (err) {
    console.error('List playthroughs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/worlds/:worldId/playthroughs
router.post('/', validate(createPlaythroughSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { worldId } = req.params;

    // Verify world exists and belongs to user
    const world = await World.findById(worldId);

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    if (world.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const playthrough = await Playthrough.create({
      name: req.body.name,
      worldId,
      userId,
    });

    res.status(201).json({ playthrough });
  } catch (err) {
    console.error('Create playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Standalone Routes (under /api/playthroughs) ---

// GET /api/playthroughs/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const playthrough = await Playthrough.findById(id).populate('worldId', 'name');

    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    if (playthrough.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ playthrough });
  } catch (err) {
    console.error('Get playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/playthroughs/:id
router.put('/:id', validate(updatePlaythroughSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const playthrough = await Playthrough.findById(id);

    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    if (playthrough.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await Playthrough.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    res.json({ playthrough: updated });
  } catch (err) {
    console.error('Update playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/playthroughs/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const playthrough = await Playthrough.findById(id);

    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    if (playthrough.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Cascade delete related models (Arc, Chapter, Character) if they exist
    try {
      const Arc = mongoose.models.Arc || mongoose.model('Arc');
      await Arc.deleteMany({ playthroughId: id });
    } catch {
      // Arc model not yet defined, skip
    }

    try {
      const Chapter = mongoose.models.Chapter || mongoose.model('Chapter');
      await Chapter.deleteMany({ playthroughId: id });
    } catch {
      // Chapter model not yet defined, skip
    }

    try {
      const Character = mongoose.models.Character || mongoose.model('Character');
      await Character.deleteMany({ playthroughId: id });
    } catch {
      // Character model not yet defined, skip
    }

    await Playthrough.findByIdAndDelete(id);

    res.json({ message: 'Playthrough deleted successfully' });
  } catch (err) {
    console.error('Delete playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
