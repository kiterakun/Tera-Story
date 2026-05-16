import { tool } from 'ai';
import { z } from 'zod';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { Location } from '../models/Location';
import { archiveEntityOutput, validateToolOutput } from './schemas';

export function makeArchiveEntityTool(playthroughId: string) {
  return tool({
    description:
      'Archive an entity (character, item, special-item, or location) that is no longer relevant to the story. Use when a character dies permanently, an item is fully consumed/destroyed, or a location becomes irrelevant. Archived entities are removed from active context but preserved for the archive viewer.',
    inputSchema: z.object({
      entityType: z
        .enum(['character', 'item', 'special-item', 'location'])
        .describe('Type of entity to archive'),
      entityName: z.string().describe('Name of the entity to archive'),
      reason: z
        .string()
        .optional()
        .describe('Reason for archiving'),
    }),
    execute: async ({ entityType, entityName, reason }) => {
      const now = new Date();
      let updated = false;

      if (entityType === 'character') {
        const result = await Character.findOneAndUpdate(
          { playthroughId, name: entityName, archivedAt: null },
          { $set: { archivedAt: now } },
        );
        updated = !!result;
      } else if (entityType === 'item') {
        const result = await Item.findOneAndUpdate(
          { playthroughId, name: entityName, archivedAt: null },
          { $set: { archivedAt: now } },
        );
        updated = !!result;
      } else if (entityType === 'special-item') {
        const result = await SpecialItem.findOneAndUpdate(
          { playthroughId, name: entityName, archivedAt: null },
          { $set: { archivedAt: now } },
        );
        updated = !!result;
      } else if (entityType === 'location') {
        const result = await Location.findOneAndUpdate(
          { playthroughId, name: entityName, archivedAt: null },
          { $set: { archivedAt: now } },
        );
        updated = !!result;
      }

      if (!updated) {
        return validateToolOutput(
          {
            archived: false,
            error: `${entityType} "${entityName}" not found or already archived`,
          },
          archiveEntityOutput,
          'archiveEntity',
        );
      }

      return validateToolOutput(
        { archived: true, entityType, entityName, reason },
        archiveEntityOutput,
        'archiveEntity',
      );
    },
  });
}
