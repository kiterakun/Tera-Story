import { Character } from '../models/Character';
import { World } from '../models/World';
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
    let defaultVal: string | number | undefined = tpl.defaultValue;
    if (defaultVal === undefined || defaultVal === null) {
      if (tpl.type === 'enum' && tpl.options && tpl.options.length > 0) {
        defaultVal = tpl.options[0];
      } else if (tpl.type === 'text') {
        defaultVal = '';
      } else {
        defaultVal = 0;
      }
    }
    return {
      k: tpl.key,
      v: defaultVal,
      t: tpl.type,
    };
  });
}

/**
 * Update a single dynamic stat for a character.
 * Validates that the stat key exists in the world's resourceTemplates,
 * and enforces min/max for 'number' type stats.
 */
export async function updateStat(
  characterId: string,
  key: string,
  value: unknown,
  userId: string
): Promise<void> {
  const character = await Character.findById(characterId);

  if (!character) {
    throw new Error('Character not found');
  }

  if (character.userId.toString() !== userId) {
    throw new Error('Unauthorized');
  }

  // Verify stat key exists in world templates
  const world = await World.findById(character.worldId).lean();

  if (!world) {
    throw new Error('World not found');
  }

  const templates = world.resourceTemplates;

  const template = templates?.find((t) => t.key === key);

  if (!template) {
    throw new Error(`Stat key "${key}" does not exist in world templates`);
  }

  // Validate min/max for number type
  if (template.type === 'number' && typeof value === 'number') {
    if (template.min !== undefined && value < template.min) {
      throw new Error(`Value ${value} is below minimum ${template.min}`);
    }
    if (template.max !== undefined && value > template.max) {
      throw new Error(`Value ${value} is above maximum ${template.max}`);
    }
  }

  // Update the specific dynamicStats entry using arrayFilters
  const result = await Character.findOneAndUpdate(
    { _id: characterId },
    { $set: { 'dynamicStats.$[elem].v': value } },
    { arrayFilters: [{ 'elem.k': key }], new: true }
  );

  if (!result) {
    throw new Error('Failed to update stat');
  }
}
