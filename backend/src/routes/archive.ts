import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { Location } from '../models/Location';
import { Organization } from '../models/Organization';
import { Playthrough } from '../models/Playthrough';

const router = Router({ mergeParams: true });

// GET /api/archive/:playthroughId — list all archived entities
router.get(
  '/:playthroughId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;

      const playthrough = await Playthrough.findById(playthroughId).lean();
      if (!playthrough) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }

      if (playthrough.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Query archived entities by bypassing the pre-hook filters
      const [characters, items, specialItems, locations, organizations] = await Promise.all([
        Character.find({ playthroughId, archivedAt: { $ne: null } }).lean(),
        Item.find({ playthroughId, archivedAt: { $ne: null } }).lean(),
        SpecialItem.find({ playthroughId, archivedAt: { $ne: null } }).lean(),
        Location.find({ playthroughId, archivedAt: { $ne: null } }).lean(),
        Organization.find({ playthroughId, archivedAt: { $ne: null } }).lean(),
      ]);

      res.json({
        characters,
        items,
        specialItems,
        locations,
        organizations,
      });
    } catch (err) {
      console.error('List archived entities error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/archive/:playthroughId/restore — unarchive an entity
router.post(
  '/:playthroughId/restore',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;
      const { entityType, entityId } = req.body;

      if (!entityType || !entityId) {
        res.status(400).json({ error: 'entityType and entityId are required' });
        return;
      }

      const playthrough = await Playthrough.findById(playthroughId).lean();
      if (!playthrough) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }

      if (playthrough.userId.toString() !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      let updated = false;

      if (entityType === 'character') {
        const result = await Character.findOneAndUpdate(
          { _id: entityId, playthroughId, archivedAt: { $ne: null } },
          { $set: { archivedAt: null } },
        );
        updated = !!result;
      } else if (entityType === 'item') {
        const result = await Item.findOneAndUpdate(
          { _id: entityId, playthroughId, archivedAt: { $ne: null } },
          { $set: { archivedAt: null } },
        );
        updated = !!result;
      } else if (entityType === 'special-item') {
        const result = await SpecialItem.findOneAndUpdate(
          { _id: entityId, playthroughId, archivedAt: { $ne: null } },
          { $set: { archivedAt: null } },
        );
        updated = !!result;
      } else if (entityType === 'location') {
        const result = await Location.findOneAndUpdate(
          { _id: entityId, playthroughId, archivedAt: { $ne: null } },
          { $set: { archivedAt: null } },
        );
        updated = !!result;
      } else if (entityType === 'organization') {
        const result = await Organization.findOneAndUpdate(
          { _id: entityId, playthroughId, archivedAt: { $ne: null } },
          { $set: { archivedAt: null } },
        );
        updated = !!result;
      } else {
        res.status(400).json({ error: 'Invalid entityType. Must be character, item, special-item, location, or organization' });
        return;
      }

      if (!updated) {
        res.status(404).json({ error: `${entityType} not found or not archived` });
        return;
      }

      res.json({ restored: true, entityType, entityId });
    } catch (err) {
      console.error('Restore archived entity error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
