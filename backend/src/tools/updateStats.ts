import { tool } from 'ai';
import { z } from 'zod';
import { Character } from '../models/Character';
import { updateStat } from '../services/characterService';
import { updateStatsOutput, validateToolOutput } from './schemas';

export function makeUpdateStatsTool(playthroughId: string, userId: string) {
  return tool({
    description: 'Update character statistics after story events. For pool type stats (HP, MP, etc.), you can also update maxV to change the current maximum.',
    inputSchema: z.object({
      characterName: z.string().describe('Name of the character to update'),
      updates: z
        .array(
          z.object({
            key: z.string().describe('The stat key to update'),
            value: z
              .union([z.string(), z.number()])
              .describe('The new value for the stat'),
            maxV: z
              .number()
              .optional()
              .describe('New max value (only for pool type stats like HP, MP)'),
          })
        )
        .describe('Array of stat updates to apply'),
    }),
    execute: async ({ characterName, updates }) => {
      const character = await Character.findOne({
        playthroughId,
        name: characterName,
      }).lean();

      if (!character) {
        return validateToolOutput({ updated: false, error: `Character "${characterName}" not found` }, updateStatsOutput, 'updateStats');
      }

      const characterId = character._id.toString();

      for (const { key, value, maxV } of updates) {
        try {
          await updateStat(characterId, key, value, userId, playthroughId, maxV);
        } catch {
          // Skip stats that don't exist in template — non-fatal
        }
      }

      return validateToolOutput({ updated: true }, updateStatsOutput, 'updateStats');
    },
  });
}
