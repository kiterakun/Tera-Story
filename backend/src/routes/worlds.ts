import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { World } from '../models/World';
import { Playthrough } from '../models/Playthrough';
import { WORLD_TEMPLATES } from '../seeds/worldTemplates';
import playthroughsRouter from './playthroughs';

const router = Router();

// Mount nested playthroughs routes
router.use('/:worldId/playthroughs', playthroughsRouter);

// --- Validation Schemas ---

const resourceTemplateSchema = z.object({
  key: z.string().min(1),
  type: z.enum(['number', 'text', 'progress', 'enum']),
  min: z.number().optional(),
  max: z.number().optional(),
  defaultValue: z.union([z.string(), z.number()]).optional(),
  displayFormat: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const specialItemFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'enum']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

const specialItemTemplateSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(specialItemFieldSchema).optional(),
});

const createWorldSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().optional(),
  genre: z.enum(['fantasy', 'sci-fi', 'wuxia', 'modern', 'custom']),
  imageUrl: z.string().url().optional(),
  resourceTemplates: z.array(resourceTemplateSchema).optional(),
  specialItemTemplates: z.array(specialItemTemplateSchema).optional(),
});

const updateWorldSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().optional(),
  genre: z.enum(['fantasy', 'sci-fi', 'wuxia', 'modern', 'custom']).optional(),
  imageUrl: z.string().url().nullable().optional(),
  resourceTemplates: z.array(resourceTemplateSchema).optional(),
  specialItemTemplates: z.array(specialItemTemplateSchema).optional(),
});

// --- Routes ---

// POST /api/worlds/from-template/:templateId (BEFORE /:id to avoid conflicts)
router.post('/from-template/:templateId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const templateId = req.params.templateId as string;

    const template = WORLD_TEMPLATES[templateId];

    if (!template) {
      res.status(404).json({ error: `Template '${templateId}' not found. Available: ${Object.keys(WORLD_TEMPLATES).join(', ')}` });
      return;
    }

    const world = await World.create({
      name: template.name,
      description: template.description,
      genre: template.genre,
      userId,
      resourceTemplates: template.resourceTemplates,
    });

    res.status(201).json({ world });
  } catch (err) {
    console.error('Create world from template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/worlds
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const worlds = await World.find({ userId }).sort({ updatedAt: -1 });

    res.json({ worlds });
  } catch (err) {
    console.error('List worlds error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/worlds/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const world = await World.findById(id);

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    if (world.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ world });
  } catch (err) {
    console.error('Get world error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/worlds
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const parsed = createWorldSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
      });
      return;
    }

    const world = await World.create({
      ...parsed.data,
      userId,
    });

    res.status(201).json({ world });
  } catch (err) {
    console.error('Create world error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/worlds/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = updateWorldSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
      });
      return;
    }

    const world = await World.findById(id);

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    if (world.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await World.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    );

    res.json({ world: updated });
  } catch (err) {
    console.error('Update world error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/worlds/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const world = await World.findById(id);

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    if (world.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Cascade delete playthroughs belonging to this world
    await Playthrough.deleteMany({ worldId: id });

    await World.findByIdAndDelete(id);

    res.json({ message: 'World deleted successfully' });
  } catch (err) {
    console.error('Delete world error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
