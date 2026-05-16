import { Router, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../middleware/auth';
import { Organization } from '../models/Organization';

const router = Router({ mergeParams: true });

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().optional(),
  type: z.string().min(1).trim(),
  goals: z.string().optional(),
  structure: z.string().optional(),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  goals: z.string().optional(),
  structure: z.string().optional(),
  status: z.enum(['active', 'disbanded', 'hidden']).optional(),
});

// GET /api/worlds/:worldId/playthroughs/:playthroughId/organizations
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { playthroughId } = req.params;

    const organizations = await Organization.find({
      playthroughId,
      archivedAt: null,
    })
      .populate('memberIds', 'name role status')
      .lean();

    res.json({ organizations });
  } catch (err) {
    console.error('List organizations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/organizations/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const organization = await Organization.findOne({
      _id: id,
      userId,
      archivedAt: null,
    })
      .populate('memberIds', 'name role status description')
      .lean();

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json({ organization });
  } catch (err) {
    console.error('Get organization error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/worlds/:worldId/playthroughs/:playthroughId/organizations
router.post('/', validate(createOrganizationSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { worldId, playthroughId } = req.params;

    const organization = await Organization.create({
      ...req.body,
      worldId,
      playthroughId,
      userId,
    });

    res.status(201).json({ organization });
  } catch (err) {
    console.error('Create organization error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/organizations/:id
router.patch('/:id', validate(updateOrganizationSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const organization = await Organization.findOneAndUpdate(
      { _id: id, userId, archivedAt: null },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json({ organization });
  } catch (err) {
    console.error('Update organization error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/organizations/:id/restore
router.post('/:id/restore', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const organization = await Organization.findOneAndUpdate(
      { _id: id, userId, archivedAt: { $ne: null } },
      { $set: { archivedAt: null } },
      { returnDocument: 'after' }
    );

    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    res.json({ organization });
  } catch (err) {
    console.error('Restore organization error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
