import { tool } from 'ai';
import { z } from 'zod';
import { addLocation } from '../agents/mapAgent';
import { validateToolOutput } from './schemas';

const discoverLocationOutput = z.object({
  locationId: z.string(),
  name: z.string(),
  type: z.string(),
});

interface DiscoverLocationToolParams {
  playthroughId: string;
  regionId: string;
}

export function makeDiscoverLocationTool(params: DiscoverLocationToolParams) {
  const { playthroughId, regionId } = params;

  return tool({
    description: 'Create a new location discovered during the story. Use when the narrative introduces a new place (town, dungeon, wilderness, ruin, sanctuary, or crossroad) that the characters visit.',
    inputSchema: z.object({
      name: z.string().describe('Location name'),
      description: z.string().describe('Brief description of the location and its significance'),
      type: z.enum(['town', 'dungeon', 'wilderness', 'ruin', 'sanctuary', 'crossroad']).describe('Type of location'),
      connectedTo: z.string().optional().describe('ID of an existing location this one connects to'),
    }),
    execute: async ({ name, description, type, connectedTo }) => {
      const location = await addLocation({
        regionId,
        playthroughId,
        name,
        description,
        type,
        connectedTo,
      });

      return validateToolOutput({
        locationId: location._id.toString(),
        name: location.name,
        type: location.type,
      }, discoverLocationOutput, 'discoverLocation');
    },
  });
}
