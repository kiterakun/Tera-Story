import { tool } from 'ai';
import { z } from 'zod';
import { Organization } from '../models/Organization';
import { initializeOrganizationDynamicStats } from '../services/organizationService';
import { queueImageGeneration } from '../services/imageService';
import { createOrganizationOutput, validateToolOutput } from './schemas';
import type { IDynamicStat } from '../types/character.types';

/**
 * Recursively merge AI-provided values into dynamicStats.
 */
function mergeAiStats(stats: IDynamicStat[], aiStats: Record<string, string | number>): void {
  for (const stat of stats) {
    if (stat.t === 'object' && stat.children) {
      mergeAiStats(stat.children, aiStats);
      continue;
    }

    if (aiStats[stat.k] !== undefined) {
      const aiValue = aiStats[stat.k];

      if (stat.t === 'number' || stat.t === 'progress') {
        const numVal = typeof aiValue === 'string' ? Number(aiValue) : aiValue;
        if (typeof numVal === 'number' && !isNaN(numVal)) {
          stat.v = numVal;
        }
      } else if (stat.t === 'pool') {
        const numVal = typeof aiValue === 'string' ? Number(aiValue) : aiValue;
        if (typeof numVal === 'number' && !isNaN(numVal)) {
          stat.v = numVal;
          if (stat.maxV !== undefined && stat.v > stat.maxV) {
            stat.v = stat.maxV;
          }
        }
      } else if (stat.t === 'text' || stat.t === 'enum') {
        stat.v = String(aiValue);
      } else {
        stat.v = aiValue as string | number;
      }
    }
  }
}

export function makeCreateOrganizationTool(
  playthroughId: string,
  worldId: string,
  userId: string,
  chapterId?: string
) {
  return tool({
    description: 'Create a new organization (faction, guild, kingdom, cult, etc.) in the story world. Organizations can have members (characters) and dynamic stats. Use when the story introduces a new faction or group.',
    inputSchema: z.object({
      name: z.string().describe('The organization name'),
      description: z.string().describe('A brief description of the organization'),
      type: z.string().describe('Type of organization (e.g., guild, kingdom, cult, faction, corporation, order)'),
      goals: z.string().optional().describe('The organization\'s goals and motivations'),
      structure: z.string().optional().describe('Organizational structure (hierarchy, leadership, ranks)'),
      dynamicStats: z.record(z.string(), z.union([z.string(), z.number()])).optional().describe(
        'An object mapping stat keys to values. For object type stats, use dot notation for nested children.'
      ),
    }),
    execute: async ({ name, description, type, goals, structure, dynamicStats: aiStats }) => {
      const existing = await Organization.findOne({
        playthroughId,
        name,
        archivedAt: null,
      }).lean();
      if (existing) {
        return validateToolOutput({
          organizationId: existing._id.toString(),
          name,
        }, createOrganizationOutput, 'createOrganization');
      }

      // Get default stats from world organization templates
      const defaultStats = await initializeOrganizationDynamicStats(worldId, type);

      // Merge AI-provided values with defaults
      if (aiStats && Object.keys(aiStats).length > 0) {
        mergeAiStats(defaultStats, aiStats);
      }

      const organization = await Organization.create({
        name,
        description,
        type,
        playthroughId,
        worldId,
        userId,
        goals: goals || '',
        structure: structure || '',
        dynamicStats: defaultStats,
        ...(chapterId ? { createdInChapterId: chapterId } : {}),
      });

      // Fire-and-forget image generation
      queueImageGeneration(
        { name, description },
        'organization',
        organization._id.toString(),
        worldId,
        userId
      );

      return validateToolOutput({
        organizationId: organization._id.toString(),
        name,
      }, createOrganizationOutput, 'createOrganization');
    },
  });
}
