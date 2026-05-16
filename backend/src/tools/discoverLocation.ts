import { tool } from 'ai';
import { z } from 'zod';
import { addLocation } from '../agents/mapAgent';
import { initializeLocationDynamicStats } from '../services/characterService';
import { validateToolOutput } from './schemas';

const discoverLocationOutput = z.object({
  locationId: z.string(),
  name: z.string(),
  type: z.string(),
});

interface DiscoverLocationToolParams {
  playthroughId: string;
  regionId: string;
  worldId: string;
}

export function makeDiscoverLocationTool(params: DiscoverLocationToolParams) {
  const { playthroughId, regionId, worldId } = params;

  return tool({
    description: 'Create a new location discovered during the story. Use when the narrative introduces a new place (town, dungeon, wilderness, ruin, sanctuary, or crossroad) that the characters visit. Optionally provide dynamicStats matching the world\'s location resource templates.',
    inputSchema: z.object({
      name: z.string().describe('Location name'),
      description: z.string().describe('Brief description of the location and its significance'),
      type: z.enum(['town', 'dungeon', 'wilderness', 'ruin', 'sanctuary', 'crossroad']).describe('Type of location'),
      connectedTo: z.string().optional().describe('ID of an existing location this one connects to'),
      dynamicStats: z.record(z.string(), z.union([z.string(), z.number()])).optional().describe(
        'An object mapping stat keys (from location resource templates) to values. E.g. { "danger_level": 5, "population": 200 }. If omitted, defaults from world location templates are used.'
      ),
    }),
    execute: async ({ name, description, type, connectedTo, dynamicStats: aiStats }) => {
      // Get default stats from world location templates
      const defaultStats = await initializeLocationDynamicStats(worldId);

      // Merge AI-provided values with defaults
      if (aiStats && Object.keys(aiStats).length > 0) {
        for (const stat of defaultStats) {
          if (aiStats[stat.k] !== undefined) {
            const aiValue = aiStats[stat.k];

            if (stat.t === 'number' || stat.t === 'progress') {
              const numVal = typeof aiValue === 'string' ? Number(aiValue) : aiValue;
              if (typeof numVal === 'number' && !isNaN(numVal)) {
                stat.v = numVal;
              }
            } else if (stat.t === 'pool') {
              const numVal = typeof aiValue === 'string' ? Number(aiValue) : aiValue;
              if (typeof numVal === 'number' && !isNaN(numVal)) {
                stat.v = numVal;
                if (stat.maxV !== undefined && stat.v > stat.maxV) {
                  stat.v = stat.maxV;
                }
              }
            } else if (stat.t === 'text' || stat.t === 'enum') {
              stat.v = String(aiValue);
            } else {
              stat.v = aiValue as string | number;
            }
          }
        }
      }

      const location = await addLocation({
        regionId,
        playthroughId,
        name,
        description,
        type,
        connectedTo,
        dynamicStats: defaultStats,
      });

      return validateToolOutput({
        locationId: location._id.toString(),
        name: location.name,
        type: location.type,
      }, discoverLocationOutput, 'discoverLocation');
    },
  });
}
