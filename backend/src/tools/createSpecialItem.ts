import { tool } from 'ai';
import { z } from 'zod';
import { SpecialItem } from '../models/SpecialItem';
import { SpecialItemTemplate } from '../models/SpecialItemTemplate';
import { Character } from '../models/Character';
import { Playthrough } from '../models/Playthrough';
import { queueImageGeneration } from '../services/imageService';

export function makeCreateSpecialItemTool(playthroughId: string, userId: string) {
  return tool({
    description:
      'Create a new special item (skill, technique, spiritual root, etc.) in the story. The category MUST match one of the world\'s special item template categories.',
    inputSchema: z.object({
      name: z.string().describe('The special item name'),
      description: z.string().describe('A brief description of the special item'),
      category: z
        .string()
        .describe('The category of the special item — MUST match an existing template category from the world'),
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
      // 1. Resolve worldId from playthrough
      const playthrough = await Playthrough.findById(playthroughId).lean();
      if (!playthrough) {
        return { error: 'Playthrough not found' };
      }

      // 2. Validate category against SpecialItemTemplate
      const template = await SpecialItemTemplate.findOne({
        worldId: playthrough.worldId,
        category,
      }).lean();

      let templateId: string | undefined;
      if (template) {
        templateId = template._id.toString();
      }
      // If no template found, still allow creation but without templateId
      // (AI may use slightly different naming — we don't hard-fail)

      // 3. Resolve owner
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

      // 4. Create SpecialItem with templateId FK
      const specialItem = await SpecialItem.create({
        name,
        description,
        category,
        rarity,
        playthroughId,
        customFields: customFields ?? {},
        ...(templateId ? { templateId } : {}),
        ...(ownerId ? { ownerId } : {}),
      });

      // 5. Fire-and-forget image generation
      queueImageGeneration(
        `Magical ability icon, centered glowing effect on dark background: ${name} — ${description}. Category: ${category}, ${rarity} tier. Ethereal digital art, mystical energy visualization, RPG skill icon style, no text, no watermark.`,
        'special-item',
        specialItem._id.toString(),
        userId
      );

      return {
        specialItemId: specialItem._id.toString(),
        name,
        category,
        templateMatched: !!template,
      };
    },
  });
}
