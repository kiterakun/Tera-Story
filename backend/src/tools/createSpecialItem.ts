import { tool } from 'ai';
import { z } from 'zod';
import { SpecialItem } from '../models/SpecialItem';
import { SpecialItemTemplate } from '../models/SpecialItemTemplate';
import { Character } from '../models/Character';
import { Playthrough } from '../models/Playthrough';
import { queueImageGeneration } from '../services/imageService';

export function makeCreateSpecialItemTool(playthroughId: string, worldId: string, userId: string) {
  return tool({
    description:
      'Create a new special item (skill, technique, spiritual root, etc.) in the story. The category MUST match one of the world\'s special item template categories. You MUST provide customFields with values for each field defined in the template (see AVAILABLE SPECIAL ITEM CATEGORIES in the prompt for field definitions).',
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
        .record(z.string(), z.union([z.string(), z.number()]))
        .optional()
        .describe('REQUIRED: Key-value pairs matching the template field definitions. Keys must match field names from the template. Values must match field types: string for text, number for number, one of the allowed options for enum fields. Example: { "Power": 85, "Element": "Fire", "Rank": "B" }'),
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

      // 4. Build validated customFields from template definition
      let finalCustomFields: Record<string, unknown> = {};
      if (template && template.fields && template.fields.length > 0) {
        for (const fieldDef of template.fields) {
          const val = customFields?.[fieldDef.name];
          if (val !== undefined) {
            // Type coercion based on field type
            if (fieldDef.type === 'number') {
              finalCustomFields[fieldDef.name] = Number(val) || 0;
            } else if (fieldDef.type === 'enum' && fieldDef.options && fieldDef.options.length > 0) {
              // Use provided value if it matches an option, otherwise use first option
              finalCustomFields[fieldDef.name] = fieldDef.options.includes(String(val)) ? String(val) : fieldDef.options[0];
            } else {
              finalCustomFields[fieldDef.name] = String(val);
            }
          } else if (fieldDef.required) {
            // Fill required fields with defaults
            if (fieldDef.type === 'number') finalCustomFields[fieldDef.name] = 0;
            else if (fieldDef.type === 'enum' && fieldDef.options?.length) finalCustomFields[fieldDef.name] = fieldDef.options[0];
            else finalCustomFields[fieldDef.name] = '';
          }
        }
        // Also include any extra customFields AI provided that aren't in template
        if (customFields) {
          for (const [k, v] of Object.entries(customFields)) {
            if (!(k in finalCustomFields)) finalCustomFields[k] = v;
          }
        }
      } else {
        finalCustomFields = customFields ?? {};
      }

      // 5. Create SpecialItem with templateId FK and validated customFields
      const specialItem = await SpecialItem.create({
        name,
        description,
        category,
        rarity,
        playthroughId,
        customFields: finalCustomFields,
        ...(templateId ? { templateId } : {}),
        ...(ownerId ? { ownerId } : {}),
      });

      // 5. Fire-and-forget image generation
      queueImageGeneration(
        { name, description, rarity, category },
        'special-item',
        specialItem._id.toString(),
        worldId,
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
