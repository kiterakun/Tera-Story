import { World } from '../models/World';
import type { IResourceTemplateDocument } from '../models/World';
import { IDynamicStat } from '../types/character.types';

/**
 * Recursively initialize a single dynamic stat from a resource template.
 */
function initStatFromTemplate(tpl: IResourceTemplateDocument): IDynamicStat {
  if (tpl.type === 'object') {
    const children = (tpl.children || []).map(initStatFromTemplate);
    return {
      k: tpl.key,
      v: '',
      t: tpl.type,
      children,
    };
  }

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
}

/**
 * Initialize dynamicStats for an organization from world organizationTemplates.
 * If orgType is provided, uses matching template; otherwise uses the first template.
 */
export async function initializeOrganizationDynamicStats(
  worldId: string,
  orgType?: string
): Promise<IDynamicStat[]> {
  const world = await World.findById(worldId).lean();

  if (!world) {
    throw new Error('World not found');
  }

  const templates = world.organizationTemplates;
  if (!templates || !Array.isArray(templates) || templates.length === 0) {
    return [];
  }

  // Find matching template by type, or use first
  const template = orgType
    ? templates.find((t) => t.type === orgType) || templates[0]
    : templates[0];

  if (!template || !template.defaultStats) {
    return [];
  }

  return template.defaultStats.map(initStatFromTemplate);
}
