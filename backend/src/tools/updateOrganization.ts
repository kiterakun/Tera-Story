import { tool } from 'ai';
import { z } from 'zod';
import { Organization } from '../models/Organization';
import { Character } from '../models/Character';
import { updateOrganizationOutput, validateToolOutput } from './schemas';

export function makeUpdateOrganizationTool(playthroughId: string) {
  return tool({
    description: 'Update an organization\'s stats, status, or membership. Use when story events change an organization (gains/loses members, power shifts, disbanding, etc.).',
    inputSchema: z.object({
      organizationName: z.string().describe('Name of the organization to update'),
      updates: z
        .array(
          z.object({
            key: z.string().describe('The stat key to update'),
            value: z
              .union([z.string(), z.number()])
              .describe('The new value'),
            maxV: z
              .number()
              .optional()
              .describe('New max value (only for pool type stats)'),
          })
        )
        .optional()
        .describe('Array of stat updates to apply'),
      status: z.enum(['active', 'disbanded', 'hidden']).optional().describe('New status for the organization'),
      addMember: z.string().optional().describe('Name of character to add as member'),
      removeMember: z.string().optional().describe('Name of character to remove from members'),
    }),
    execute: async ({ organizationName, updates, status, addMember, removeMember }) => {
      const organization = await Organization.findOne({
        playthroughId,
        name: organizationName,
        archivedAt: null,
      });

      if (!organization) {
        return validateToolOutput(
          { updated: false, error: `Organization "${organizationName}" not found` },
          updateOrganizationOutput,
          'updateOrganization'
        );
      }

      // Update stats
      if (updates && updates.length > 0) {
        for (const update of updates) {
          const statIndex = organization.dynamicStats.findIndex(
            (s) => s.k === update.key
          );
          if (statIndex >= 0) {
            const stat = organization.dynamicStats[statIndex];
            if (stat) {
              stat.v = update.value;
              if (update.maxV !== undefined && stat.t === 'pool') {
                stat.maxV = update.maxV;
                if (typeof stat.v === 'number' && stat.maxV !== undefined && stat.v > stat.maxV) {
                  stat.v = stat.maxV;
                }
              }
            }
          } else {
            // Add new stat if not exists
            organization.dynamicStats.push({
              k: update.key,
              v: update.value,
              t: update.maxV !== undefined
                ? 'pool'
                : typeof update.value === 'number'
                  ? 'number'
                  : 'text',
              maxV: update.maxV,
            });
          }
        }
      }

      // Update status
      if (status) {
        organization.status = status;
      }

      // Add member
      if (addMember) {
        const character = await Character.findOne({
          playthroughId,
          name: addMember,
          archivedAt: null,
        }).lean();
        if (character) {
          const charId = character._id.toString();
          const isAlreadyMember = organization.memberIds.some(
            (id) => id.toString() === charId
          );
          if (!isAlreadyMember) {
            organization.memberIds.push(character._id);
          }
        }
      }

      // Remove member
      if (removeMember) {
        const character = await Character.findOne({
          playthroughId,
          name: removeMember,
          archivedAt: null,
        }).lean();
        if (character) {
          organization.memberIds = organization.memberIds.filter(
            (id) => id.toString() !== character._id.toString()
          );
        }
      }

      organization.markModified('dynamicStats');
      await organization.save();

      return validateToolOutput(
        { updated: true, organizationName },
        updateOrganizationOutput,
        'updateOrganization'
      );
    },
  });
}
