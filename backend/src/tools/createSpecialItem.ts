import { tool } from 'ai';
import { z } from 'zod';
import { SpecialItem } from '../models/SpecialItem';
import { Character } from '../models/Character';
import { queueImageGeneration } from '../services/imageService';

export function makeCreateSpecialItemTool(playthroughId: string, userId: string) {
  return tool({
    description:
      'Create a new special item (skill, technique, spiritual root, etc.) in the story',
    inputSchema: z.object({
      name: z.string().describe('The special item name'),
      description: z.string().describe('A brief description of the special item'),
      category: z
        .string()
        .describe('The category of the special item (e.g. skill, technique, spiritual_root)'),
      rarity: z
        .enum(['common', 'uncommon', 'rare', 'epic', 'legendary'])
        .describe('The rarity tier of the special item'),
      ownerName: z
        .string()
        .optional()
        .describe('Name of the character who acquires/learns this special item'),
      customFields: z
        .record(z.string(), z.unknown())
        .optional()
        .describe('Additional custom fields matching the world template definition'),
    }),
    execute: async ({ name, description, category, rarity, ownerName, customFields }) => {
      let ownerId: string | undefined;

      if (ownerName) {
        const owner = await Character.findOne({
          playthroughId,
          name: ownerName,
        }).lean();
        if (owner) {
          ownerId = owner._id.toString();
        }
      }

      const specialItem = await SpecialItem.create({
        name,
        description,
        category,
        rarity,
        playthroughId,
        customFields: customFields ?? {},
        ...(ownerId ? { ownerId } : {}),
      });

      // Fire-and-forget image generation
      queueImageGeneration(
        `${name}: ${description}. Category: ${category}. ${rarity} rarity. Fantasy RPG ability/skill illustration, magical, detailed.`,
        'special-item',
        specialItem._id.toString(),
        userId
      );

      return { specialItemId: specialItem._id.toString(), name, category };
    },
  });
}
