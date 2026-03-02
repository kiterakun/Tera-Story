import { tool } from 'ai';
import { z } from 'zod';
import { Character } from '../models/Character';
import { initializeDynamicStats } from '../services/characterService';
import { queueImageGeneration } from '../services/imageService';

export function makeCreateCharacterTool(
  playthroughId: string,
  worldId: string,
  userId: string
) {
  return tool({
    description: 'Create a new NPC character in the story world. You MUST provide dynamicStats with meaningful values for each resource template stat based on the character role, strength, and story context.',
    inputSchema: z.object({
      name: z.string().describe('The character name'),
      description: z.string().describe('A brief description of the character'),
      role: z.enum(['npc']).describe('Character role — always npc for tool-created characters'),
      dynamicStats: z.record(z.string(), z.union([z.string(), z.number()])).optional().describe(
        'An object mapping stat keys (from resource templates) to values. E.g. { "HP": 80, "MP": 50, "Strength": 65 }. Values must respect the stat type and min/max constraints. If omitted, defaults from world templates are used.'
      ),
    }),
    execute: async ({ name, description, role, dynamicStats: aiStats }) => {
      // Get default stats from world templates
      const defaultStats = await initializeDynamicStats(worldId);

      // Merge AI-provided values with defaults, validating against templates
      if (aiStats && Object.keys(aiStats).length > 0) {
        for (const stat of defaultStats) {
          if (aiStats[stat.k] !== undefined) {
            const aiValue = aiStats[stat.k];

            // Validate and coerce based on stat type
            if (stat.t === 'number' || stat.t === 'progress') {
              const numVal = typeof aiValue === 'string' ? Number(aiValue) : aiValue;
              if (typeof numVal === 'number' && !isNaN(numVal)) {
                stat.v = numVal;
              }
            } else if (stat.t === 'text' || stat.t === 'enum') {
              stat.v = String(aiValue);
            } else {
              stat.v = aiValue as string | number;
            }
          }
        }
      }

      const character = await Character.create({
        name,
        description,
        role,
        playthroughId,
        worldId,
        userId,
        dynamicStats: defaultStats,
      });

      // Fire-and-forget image generation
      queueImageGeneration(
        `Character portrait, close-up bust shot facing the viewer: ${name}. ${description}. Highly detailed digital painting, painterly style, dramatic lighting, RPG character illustration. No text, no watermark, no frame.`,
        'character',
        character._id.toString(),
        userId
      );
      return { characterId: character._id.toString(), name };
    },
  });
}
