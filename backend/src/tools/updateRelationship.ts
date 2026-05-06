import { tool } from 'ai';
import { z } from 'zod';
import { Character } from '../models/Character';
import { Relationship } from '../models/Relationship';

export function makeUpdateRelationshipTool(playthroughId: string) {
  return tool({
    description:
      'Create or update a relationship between two characters. Use when story events change how characters relate to each other (forming alliances, betrayals, romantic developments, etc.)',
    inputSchema: z.object({
      characterAName: z.string().describe('Name of the first character'),
      characterBName: z.string().describe('Name of the second character'),
      type: z
        .enum(['ally', 'enemy', 'romantic', 'mentor', 'rival', 'neutral', 'family'])
        .describe('The type of relationship'),
      intensity: z
        .number()
        .min(-100)
        .max(100)
        .describe('Intensity from -100 (deep hatred) to +100 (absolute devotion). 0 = neutral.'),
    }),
    execute: async ({ characterAName, characterBName, type, intensity }) => {
      // Resolve character IDs
      const [charA, charB] = await Promise.all([
        Character.findOne({ playthroughId, name: characterAName }).lean(),
        Character.findOne({ playthroughId, name: characterBName }).lean(),
      ]);

      if (!charA) return { updated: false, error: `Character "${characterAName}" not found` };
      if (!charB) return { updated: false, error: `Character "${characterBName}" not found` };

      // Ensure consistent ordering (smaller ID first) to prevent A-B / B-A duplicates
      const [idA, idB] = [charA._id.toString(), charB._id.toString()].sort();

      await Relationship.findOneAndUpdate(
        { playthroughId, characterA: idA, characterB: idB },
        { type, intensity: Math.max(-100, Math.min(100, intensity)) },
        { upsert: true, new: true }
      );

      return { updated: true, characterA: characterAName, characterB: characterBName, type, intensity };
    },
  });
}
