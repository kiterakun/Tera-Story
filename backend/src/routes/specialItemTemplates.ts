import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { SpecialItemTemplate } from '../models/SpecialItemTemplate';
import { World } from '../models/World';

const router = Router();

// --- Validation Schemas ---
const specialItemFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'enum']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

const createTemplateSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(specialItemFieldSchema).optional(),
});

const updateTemplateSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  fields: z.array(specialItemFieldSchema).optional(),
});

// GET /api/worlds/:worldId/special-item-templates
router.get(
  '/worlds/:worldId/special-item-templates',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { worldId } = req.params;

      const world = await World.findById(worldId).lean();
      if (!world) {
        res.status(404).json({ error: 'World not found' });
        return;
      }
      if (world.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const templates = await SpecialItemTemplate.find({ worldId }).sort({ createdAt: 1 }).lean();
      res.json({ specialItemTemplates: templates });
    } catch (err) {
      console.error('List special item templates error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/special-item-templates/:id
router.get(
  '/special-item-templates/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await SpecialItemTemplate.findById(id).lean();

      if (!template) {
        res.status(404).json({ error: 'Special item template not found' });
        return;
      }

      res.json({ specialItemTemplate: template });
    } catch (err) {
      console.error('Get special item template error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/worlds/:worldId/special-item-templates
router.post(
  '/worlds/:worldId/special-item-templates',
  validate(createTemplateSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { worldId } = req.params;

      const world = await World.findById(worldId).lean();
      if (!world) {
        res.status(404).json({ error: 'World not found' });
        return;
      }
      if (world.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const template = await SpecialItemTemplate.create({
        ...req.body,
        worldId,
      });

      res.status(201).json({ specialItemTemplate: template });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
        res.status(409).json({ error: 'A template with this category already exists in this world' });
        return;
      }
      console.error('Create special item template error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/worlds/:worldId/special-item-templates/batch — create multiple templates at once
router.post(
  '/worlds/:worldId/special-item-templates/batch',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { worldId } = req.params;

      const world = await World.findById(worldId).lean();
      if (!world) {
        res.status(404).json({ error: 'World not found' });
        return;
      }
      if (world.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const batchSchema = z.object({
        templates: z.array(createTemplateSchema).min(1),
      });
      const parsed = batchSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
        return;
      }

      const docs = parsed.data.templates.map((t) => ({ ...t, worldId }));
      const templates = await SpecialItemTemplate.insertMany(docs);

      res.status(201).json({ specialItemTemplates: templates });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
        res.status(409).json({ error: 'Duplicate category detected in batch' });
        return;
      }
      console.error('Batch create special item templates error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/special-item-templates/:id
router.put(
  '/special-item-templates/:id',
  validate(updateTemplateSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const template = await SpecialItemTemplate.findById(id);
      if (!template) {
        res.status(404).json({ error: 'Special item template not found' });
        return;
      }

      // Verify world ownership
      const world = await World.findById(template.worldId).lean();
      if (!world || world.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const updated = await SpecialItemTemplate.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      );

      res.json({ specialItemTemplate: updated });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
        res.status(409).json({ error: 'A template with this category already exists in this world' });
        return;
      }
      console.error('Update special item template error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/special-item-templates/:id
router.delete(
  '/special-item-templates/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const template = await SpecialItemTemplate.findById(id);
      if (!template) {
        res.status(404).json({ error: 'Special item template not found' });
        return;
      }

      // Verify world ownership
      const world = await World.findById(template.worldId).lean();
      if (!world || world.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await SpecialItemTemplate.findByIdAndDelete(id);
      res.json({ message: 'Special item template deleted successfully' });
    } catch (err) {
      console.error('Delete special item template error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
