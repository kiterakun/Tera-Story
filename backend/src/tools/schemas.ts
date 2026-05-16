import { z } from 'zod';

// ────────────────────────────────────────────────────────────
// Output validation schemas for tool return values.
// Non-blocking: logs errors but does not crash the agent flow.
// ────────────────────────────────────────────────────────────

export function validateToolOutput<T>(
  result: T,
  schema: z.ZodSchema<T>,
  toolName: string,
): T {
  const parsed = schema.safeParse(result);
  if (!parsed.success) {
    console.error(
      `[${toolName}] Output validation failed:`,
      JSON.stringify(parsed.error.issues),
    );
  }
  return result;
}

// ── Character ──

export const createCharacterOutput = z.object({
  characterId: z.string(),
  name: z.string(),
});

// ── Item ──

export const createItemOutput = z.object({
  itemId: z.string(),
  name: z.string(),
});

// ── SpecialItem ──

export const createSpecialItemOutput = z.union([
  z.object({
    specialItemId: z.string(),
    name: z.string(),
    category: z.string(),
    templateMatched: z.boolean(),
  }),
  z.object({ error: z.string() }),
]);

// ── Stats ──

export const updateStatsOutput = z.discriminatedUnion('updated', [
  z.object({ updated: z.literal(true) }),
  z.object({ updated: z.literal(false), error: z.string() }),
]);

// ── Combat ──

export const initiateCombatOutput = z.discriminatedUnion('initiated', [
  z.object({
    initiated: z.literal(true),
    combatId: z.string(),
    combatants: z.array(
      z.object({
        name: z.string(),
        side: z.enum(['player', 'enemy']),
        hp: z.number(),
      }),
    ),
    availableActions: z.array(z.string()),
  }),
  z.object({ initiated: z.literal(false), error: z.string() }),
]);

// ── Choices ──

export const generateChoicesOutput = z.object({
  choices: z.array(
    z.object({
      text: z.string(),
      type: z.enum(['continue', 'new_arc', 'custom']),
    }),
  ),
});

// ── Consequence ──

export const plantConsequenceOutput = z.discriminatedUnion('planted', [
  z.object({
    planted: z.literal(true),
    description: z.string(),
    minChapterDelay: z.number(),
    impact: z.enum(['minor', 'major', 'critical']),
  }),
  z.object({ planted: z.literal(false), error: z.string() }),
]);

export const activateConsequenceOutput = z.discriminatedUnion('activated', [
  z.object({
    activated: z.literal(true),
    description: z.string(),
    impact: z.enum(['minor', 'major', 'critical']),
  }),
  z.object({ activated: z.literal(false), error: z.string() }),
]);

// ── Arc ──

export const summarizeArcOutput = z.object({
  arcId: z.string(),
  summarized: z.literal(true),
});

// ── Entity Status ──

export const updateEntityStatusOutput = z.discriminatedUnion('updated', [
  z.object({
    updated: z.literal(true),
    entityType: z.enum(['character', 'item', 'special-item']),
    entityName: z.string(),
    newStatus: z.string(),
    reason: z.string().optional(),
  }),
  z.object({ updated: z.literal(false), error: z.string() }),
]);

// ── Relationship ──

export const updateRelationshipOutput = z.discriminatedUnion('updated', [
  z.object({
    updated: z.literal(true),
    characterA: z.string(),
    characterB: z.string(),
    type: z.enum([
      'ally',
      'enemy',
      'romantic',
      'mentor',
      'rival',
      'neutral',
      'family',
    ]),
    intensity: z.number(),
  }),
  z.object({ updated: z.literal(false), error: z.string() }),
]);

// ── Archive ──

export const archiveEntityOutput = z.discriminatedUnion('archived', [
  z.object({
    archived: z.literal(true),
    entityType: z.string(),
    entityName: z.string(),
    reason: z.string().optional(),
  }),
  z.object({ archived: z.literal(false), error: z.string() }),
]);

// ── Location Stats ──

export const updateLocationStatsOutput = z.discriminatedUnion('updated', [
  z.object({ updated: z.literal(true), locationName: z.string() }),
  z.object({ updated: z.literal(false), error: z.string() }),
]);

// ── Organization ──

export const createOrganizationOutput = z.object({
  organizationId: z.string(),
  name: z.string(),
});

export const updateOrganizationOutput = z.discriminatedUnion('updated', [
  z.object({ updated: z.literal(true), organizationName: z.string() }),
  z.object({ updated: z.literal(false), error: z.string() }),
]);
