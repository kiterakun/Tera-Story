import { tool } from 'ai';
import { z } from 'zod';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';

export function makeUpdateEntityStatusTool(playthroughId: string) {
  return tool({
    description:
      'Update the status of a character, item, or special item when story events change their state (e.g. character dies, item is destroyed, ability is sealed)',
    inputSchema: z.object({
      entityType: z
        .enum(['character', 'item', 'special-item'])
        .describe('The type of entity to update'),
      entityName: z.string().describe('The name of the entity'),
      newStatus: z
        .string()
        .describe(
          'The new status. For characters: active|dead|injured|missing. For items: active|destroyed|lost|consumed. For special items: active|sealed|lost|consumed'
        ),
      reason: z
        .string()
        .optional()
        .describe('Brief reason for the status change (for logging/context)'),
    }),
    execute: async ({ entityType, entityName, newStatus, reason }) => {
      const validStatuses: Record<string, string[]> = {
        character: ['active', 'dead', 'injured', 'missing'],
        item: ['active', 'destroyed', 'lost', 'consumed'],
        'special-item': ['active', 'sealed', 'lost', 'consumed'],
      };

      const allowed = validStatuses[entityType];
      if (!allowed || !allowed.includes(newStatus)) {
        return {
          updated: false,
          error: `Invalid status "${newStatus}" for ${entityType}. Valid: ${allowed?.join(', ')}`,
        };
      }

      if (entityType === 'character') {
        const result = await Character.findOneAndUpdate(
          { playthroughId, name: entityName },
          { status: newStatus },
          { returnDocument: 'after' }
        );
        if (!result) return { updated: false, error: `Character "${entityName}" not found` };
        return { updated: true, entityType, entityName, newStatus, reason };
      }

      if (entityType === 'item') {
        const result = await Item.findOneAndUpdate(
          { playthroughId, name: entityName },
          { status: newStatus },
          { returnDocument: 'after' }
        );
        if (!result) return { updated: false, error: `Item "${entityName}" not found` };
        return { updated: true, entityType, entityName, newStatus, reason };
      }

      if (entityType === 'special-item') {
        const result = await SpecialItem.findOneAndUpdate(
          { playthroughId, name: entityName },
          { status: newStatus },
          { returnDocument: 'after' }
        );
        if (!result) return { updated: false, error: `Special item "${entityName}" not found` };
        return { updated: true, entityType, entityName, newStatus, reason };
      }

      return { updated: false, error: 'Unknown entity type' };
    },
  });
}
