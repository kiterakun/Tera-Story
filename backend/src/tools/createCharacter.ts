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
    description: 'Create a new NPC character in the story world',
    inputSchema: z.object({
      name: z.string().describe('The character name'),
      description: z.string().describe('A brief description of the character'),
      role: z.enum(['npc']).describe('Character role — always npc for tool-created characters'),
    }),
    execute: async ({ name, description, role }) => {
      const dynamicStats = await initializeDynamicStats(worldId);

      const character = await Character.create({
        name,
        description,
        role,
        playthroughId,
        worldId,
        userId,
        dynamicStats,
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
