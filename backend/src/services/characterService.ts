import { Character } from '../models/Character';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';
import type { IResourceTemplateDocument } from '../models/World';
import { IDynamicStat } from '../types/character.types';

/**
 * Initialize dynamicStats from world resourceTemplates.
 * Each template becomes { k: template.key, v: template.defaultValue ?? 0, t: template.type }.
 */
export async function initializeDynamicStats(
  worldId: string
): Promise<IDynamicStat[]> {
  const world = await World.findById(worldId).lean();

  if (!world) {
    throw new Error('World not found');
  }

  const templates = world.resourceTemplates;

  if (!templates || !Array.isArray(templates)) {
    return [];
  }

  return templates.map((tpl) => {
    let defaultVal: string | number | boolean;
    if (tpl.defaultValue !== undefined && tpl.defaultValue !== null) {
      defaultVal = tpl.defaultValue as string | number | boolean;
    } else if (tpl.type === 'enum' && tpl.options && tpl.options.length > 0) {
      defaultVal = tpl.options[0] || '';
    } else if (tpl.type === 'text') {
      defaultVal = '';
    } else {
      defaultVal = 0;
    }
    return {
      k: tpl.key,
      v: defaultVal,
      t: tpl.type,
    };
  });
}

function validateStatValue(
  template: IResourceTemplateDocument,
  key: string,
  value: unknown
): void {
  if (template.type === 'enum') {
    if (typeof value !== 'string') {
      throw new Error(`Stat "${key}" requires a string enum value`);
    }
    if (!template.options?.includes(value)) {
      throw new Error(`Stat "${key}" must be one of: ${(template.options || []).join(', ')}`);
    }
    return;
  }

  if (template.type === 'number') {
    if (typeof value !== 'number') {
      throw new Error(`Stat "${key}" requires a number value`);
    }
    if (template.min !== undefined && value < template.min) {
      throw new Error(`Value ${value} is below minimum ${template.min}`);
    }
    if (template.max !== undefined && value > template.max) {
      throw new Error(`Value ${value} is above maximum ${template.max}`);
    }
    return;
  }

  if (template.type === 'progress') {
    if (typeof value !== 'number') {
      throw new Error(`Stat "${key}" requires a number value`);
    }
    if (value < 0 || value > 100) {
      throw new Error(`Progress stat "${key}" must be between 0 and 100`);
    }
  }
}

/**
 * Update a single dynamic stat for a character.
 * Validates values against the world's resourceTemplates before saving.
 * Unknown stat keys are allowed for custom stats.
 */
export async function updateStat(
  characterId: string,
  key: string,
  value: unknown,
  userId: string,
  playthroughId?: string
): Promise<void> {
  const character = await Character.findById(characterId);

  if (!character) {
    throw new Error('Character not found');
  }

  if (character.userId.toString() !== userId) {
    throw new Error('Unauthorized');
  }

  let worldId = character.worldId;

  if (playthroughId) {
    const playthrough = await Playthrough.findById(playthroughId).select('worldId').lean();
    if (!playthrough) {
      throw new Error('Playthrough not found');
    }
    worldId = playthrough.worldId;
  }

  const world = await World.findById(worldId).lean();

  if (!world) {
    throw new Error('World not found');
  }

  const template = world.resourceTemplates?.find((t) => t.key === key);

  if (template) {
    validateStatValue(template, key, value);
  }

  // Update the specific dynamicStats entry using arrayFilters
  const result = await Character.findOneAndUpdate(
    { _id: characterId },
    { $set: { 'dynamicStats.$[elem].v': value } },
    { arrayFilters: [{ 'elem.k': key }], returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Failed to update stat');
  }
}
