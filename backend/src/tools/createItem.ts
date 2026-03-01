import { tool } from 'ai';
import { z } from 'zod';
import { Item } from '../models/Item';
import { Character } from '../models/Character';

export function makeCreateItemTool(playthroughId: string, userId: string) {
  return tool({
    description: 'Create a new item in the story',
    inputSchema: z.object({
      name: z.string().describe('The item name'),
      description: z.string().describe('A brief description of the item'),
      rarity: z
        .enum(['common', 'uncommon', 'rare', 'epic', 'legendary'])
        .describe('The rarity tier of the item'),
      ownerName: z
        .string()
        .optional()
        .describe('Name of the character who owns this item'),
    }),
    execute: async ({ name, description, rarity, ownerName }) => {
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

      const item = await Item.create({
        name,
        description,
        rarity,
        playthroughId,
        ...(ownerId ? { ownerId } : {}),
      });

      return { itemId: item._id.toString(), name };
    },
  });
}
