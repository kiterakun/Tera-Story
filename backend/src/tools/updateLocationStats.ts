import { tool } from 'ai';
import { z } from 'zod';
import { Location } from '../models/Location';
import { updateLocationStatsOutput, validateToolOutput } from './schemas';

export function makeUpdateLocationStatsTool(playthroughId: string) {
  return tool({
    description:
      "Update dynamic statistics for a location. Use when story events change a location's properties (e.g., danger level increases after an attack, population changes, corruption spreads).",
    inputSchema: z.object({
      locationName: z.string().describe('Name of the location to update'),
      updates: z
        .array(
          z.object({
            key: z.string().describe('The stat key to update'),
            value: z
              .union([z.string(), z.number()])
              .describe('The new value'),
            maxV: z
              .number()
              .optional()
              .describe('New max value (only for pool type stats)'),
          }),
        )
        .describe('Array of stat updates'),
    }),
    execute: async ({ locationName, updates }) => {
      const location = await Location.findOne({
        playthroughId,
        name: locationName,
      });
      if (!location) {
        return validateToolOutput(
          { updated: false, error: `Location "${locationName}" not found` },
          updateLocationStatsOutput,
          'updateLocationStats',
        );
      }

      for (const update of updates) {
        const statIndex = location.dynamicStats.findIndex(
          (s) => s.k === update.key,
        );
        if (statIndex >= 0) {
          const stat = location.dynamicStats[statIndex];
          if (stat) {
            stat.v = update.value;
            if (update.maxV !== undefined && stat.t === 'pool') {
              stat.maxV = update.maxV;
              if (
                typeof stat.v === 'number' &&
                stat.maxV !== undefined &&
                stat.v > stat.maxV
              ) {
                stat.v = stat.maxV;
              }
            }
          }
        } else {
          // Add new stat if not exists
          location.dynamicStats.push({
            k: update.key,
            v: update.value,
            t:
              update.maxV !== undefined
                ? 'pool'
                : typeof update.value === 'number'
                  ? 'number'
                  : 'text',
            maxV: update.maxV,
          });
        }
      }

      await location.save();
      return validateToolOutput(
        { updated: true, locationName },
        updateLocationStatsOutput,
        'updateLocationStats',
      );
    },
  });
}
