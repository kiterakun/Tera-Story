import { Character } from '../models/Character';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';
import type { IResourceTemplateDocument } from '../models/World';
import { IDynamicStat } from '../types/character.types';

/**
 * Initialize dynamicStats from world resourceTemplates.
 * Each template becomes { k: template.key, v: template.defaultValue ?? 0, t: template.type }.
 * For 'pool' type: v and maxV are both set from defaultValue (or max).
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

    // For pool type, set maxV from defaultValue or max
    if (tpl.type === 'pool') {
      const poolVal = typeof defaultVal === 'number' ? defaultVal : (tpl.max ?? 0);
      return {
        k: tpl.key,
        v: poolVal,
        t: tpl.type,
        maxV: poolVal,
      };
    }

    return {
      k: tpl.key,
      v: defaultVal,
      t: tpl.type,
    };
  });
}

/**
 * Initialize dynamicStats for a location from world locationResourceTemplates.
 */
export async function initializeLocationDynamicStats(
  worldId: string
): Promise<IDynamicStat[]> {
  const world = await World.findById(worldId).lean();

  if (!world) {
    throw new Error('World not found');
  }

  const templates = world.locationResourceTemplates;

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

    if (tpl.type === 'pool') {
      const poolVal = typeof defaultVal === 'number' ? defaultVal : (tpl.max ?? 0);
      return {
        k: tpl.key,
        v: poolVal,
        t: tpl.type,
        maxV: poolVal,
      };
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
  value: unknown,
  maxV?: number
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
    return;
  }

  if (template.type === 'pool') {
    if (typeof value !== 'number') {
      throw new Error(`Stat "${key}" requires a number value for pool type`);
    }
    const hardMax = template.max ?? 999;
    const min = template.min ?? 0;
    if (value < min) {
      throw new Error(`Value ${value} is below minimum ${min}`);
    }
    if (value > hardMax) {
      throw new Error(`Value ${value} is above hard max ${hardMax}`);
    }
    if (maxV !== undefined) {
      if (typeof maxV !== 'number') {
        throw new Error(`maxV for stat "${key}" must be a number`);
      }
      if (maxV < min || maxV > hardMax) {
        throw new Error(`maxV ${maxV} is out of range [${min}, ${hardMax}]`);
      }
    }
  }
}

/**
 * Update a single dynamic stat for a character.
 * Validates values against the world's resourceTemplates before saving.
 * Unknown stat keys are allowed for custom stats.
 * For pool type, accepts optional maxV parameter to update the max value.
 */
export async function updateStat(
  characterId: string,
  key: string,
  value: unknown,
  userId: string,
  playthroughId?: string,
  maxV?: number
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
    validateStatValue(template, key, value, maxV);
  }

  // For pool type: auto-clamp v if v > maxV
  if (template?.type === 'pool' && maxV !== undefined && typeof value === 'number') {
    if (value > maxV) {
      value = maxV;
    }
  }

  // Build update: always set v, optionally set maxV for pool type
  const $set: Record<string, unknown> = { 'dynamicStats.$[elem].v': value };
  if (maxV !== undefined && template?.type === 'pool') {
    $set['dynamicStats.$[elem].maxV'] = maxV;
  }

  // Update the specific dynamicStats entry using arrayFilters
  const result = await Character.findOneAndUpdate(
    { _id: characterId },
    { $set },
    { arrayFilters: [{ 'elem.k': key }], returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Failed to update stat');
  }
}
