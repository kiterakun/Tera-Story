import { tool } from 'ai';
import { z } from 'zod';
import { Location } from '../models/Location';
import { updateLocationStatsOutput, validateToolOutput } from './schemas';
import type { IDynamicStat } from '../types/character.types';

/**
 * Resolve a nested stat by dot-notation path.
 */
function resolveNestedStat(
  stats: IDynamicStat[],
  keyPath: string
): IDynamicStat | undefined {
  const parts = keyPath.split('.');
  let current = stats;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const stat = current.find((s) => s.k === part);
    if (!stat) return undefined;
    if (i === parts.length - 1) return stat;
    if (stat.t !== 'object' || !stat.children) return undefined;
    current = stat.children;
  }

  return undefined;
}

export function makeUpdateLocationStatsTool(playthroughId: string) {
  return tool({
    description:
      "Update dynamic statistics for a location. Use when story events change a location's properties (e.g., danger level increases after an attack, population changes, corruption spreads). For object type stats, use dot notation (e.g., 'features.defense').",
    inputSchema: z.object({
      locationName: z.string().describe('Name of the location to update'),
      updates: z
        .array(
          z.object({
            key: z.string().describe('The stat key to update (supports dot notation for nested object stats, e.g. "features.defense")'),
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
        const isNested = update.key.includes('.');
        const stat = isNested
          ? resolveNestedStat(location.dynamicStats, update.key)
          : location.dynamicStats.find((s) => s.k === update.key);

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
        } else if (!isNested) {
          // Add new stat if not exists (only for top-level keys)
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

      location.markModified('dynamicStats');
      await location.save();
      return validateToolOutput(
        { updated: true, locationName },
        updateLocationStatsOutput,
        'updateLocationStats',
      );
    },
  });
}
