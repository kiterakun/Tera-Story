/**
 * /api/v1/playthroughs/* — director + memory endpoints.
 *
 * GET  /api/v1/playthroughs/:id/director — fetch directorSettings
 * PUT  /api/v1/playthroughs/:id/director — update directorSettings (Zod)
 * GET  /api/v1/playthroughs/:id/memory   — fetch AI-known entity snapshot
 *
 * Mounted under /api/v1 via v1/router so envelope middleware applies.
 */

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Playthrough, DEFAULT_DIRECTOR_SETTINGS } from '../models/Playthrough';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { Organization } from '../models/Organization';
import { Location } from '../models/Location';
import { logger } from '../utils/logger';

const router = Router();

const playthroughIdParam = z.object({
  id: z.string().refine((s) => mongoose.Types.ObjectId.isValid(s), { message: 'Invalid id' }),
});

const directorUpdateSchema = z
  .object({
    tone: z.enum(['serious', 'balanced', 'whimsical']).optional(),
    danger: z.number().int().min(0).max(100).optional(),
    romance: z.number().int().min(0).max(100).optional(),
    comedy: z.number().int().min(0).max(100).optional(),
    pacing: z.enum(['slow', 'normal', 'fast']).optional(),
  })
  .strict();

// GET /api/v1/playthroughs/:id/director
router.get(
  '/:id/director',
  validate(playthroughIdParam, 'params'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as z.infer<typeof playthroughIdParam>;
      const userId = req.user!.id;
      const pt = await Playthrough.findOne({ _id: id, userId, deletedAt: null })
        .select('directorSettings')
        .lean();
      if (!pt) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }
      const director = pt.directorSettings ?? DEFAULT_DIRECTOR_SETTINGS;
      res.json({ success: true, data: { director } });
    } catch (err) {
      logger.error({ err }, 'Get director settings error');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PUT /api/v1/playthroughs/:id/director
router.put(
  '/:id/director',
  validate(playthroughIdParam, 'params'),
  validate(directorUpdateSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as z.infer<typeof playthroughIdParam>;
      const userId = req.user!.id;
      const updates = req.body as z.infer<typeof directorUpdateSchema>;
      const setUpdate: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) {
        setUpdate[`directorSettings.${k}`] = v;
      }
      const pt = await Playthrough.findOneAndUpdate(
        { _id: id, userId, deletedAt: null },
        { $set: setUpdate },
        { returnDocument: 'after' },
      )
        .select('directorSettings')
        .lean();
      if (!pt) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }
      res.json({ success: true, data: { director: pt.directorSettings } });
    } catch (err) {
      logger.error({ err }, 'Update director settings error');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/v1/playthroughs/:id/memory
// Returns the AI-known entity snapshot: characters, items, special items,
// organizations, current location, and active echoes.
router.get(
  '/:id/memory',
  validate(playthroughIdParam, 'params'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params as z.infer<typeof playthroughIdParam>;
      const userId = req.user!.id;
      const pt = await Playthrough.findOne({ _id: id, userId, deletedAt: null })
        .select('worldId currentLocationId')
        .lean();
      if (!pt) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }
      const [characters, items, specialItems, organizations, currentLocation] = await Promise.all([
        Character.find({ playthroughId: id, userId, archivedAt: null, deletedAt: null })
          .select('name role status dynamicStats')
          .limit(200)
          .lean(),
        Item.find({ playthroughId: id, userId, archivedAt: null, deletedAt: null })
          .select('name rarity')
          .limit(200)
          .lean(),
        SpecialItem.find({ playthroughId: id, userId, archivedAt: null, deletedAt: null })
          .select('name category')
          .limit(200)
          .lean(),
        Organization.find({ worldId: pt.worldId, userId, archivedAt: null, deletedAt: null })
          .select('name status')
          .limit(100)
          .lean(),
        pt.currentLocationId
          ? Location.findOne({ _id: pt.currentLocationId, deletedAt: null })
              .select('name description')
              .lean()
          : Promise.resolve(null),
      ]);
      res.json({
        success: true,
        data: {
          characters,
          items,
          specialItems,
          organizations,
          currentLocation,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Get memory snapshot error');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
