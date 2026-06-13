/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { z } from 'zod';
import { makePlantConsequenceTool, makeActivateConsequenceTool } from '../../tools/plantConsequence';
import { ConsequenceSeed } from '../../models/ConsequenceSeed';
import { Chapter } from '../../models/Chapter';

// ── Zod schemas for direct validation testing ─────────────────────────────

const plantConsequenceInputSchema = z.object({
  description: z.string().describe(
    'What happened and what the future consequence should be. Be specific. E.g. "Player spared the assassin Kael — Kael may return to help or betray later"',
  ),
  minChapterDelay: z.number().min(1).max(20).default(3).describe(
    'Minimum number of chapters before this consequence can activate (1-20, default 3)',
  ),
  impact: z.enum(['minor', 'major', 'critical']).describe(
    'How significant the consequence will be when it activates',
  ),
  tags: z.array(z.string()).describe(
    'Tags for categorization, e.g. ["mercy", "assassin", "debt"]',
  ),
});

const activateConsequenceInputSchema = z.object({
  consequenceDescription: z.string().describe(
    'The description of the consequence seed being activated (match it from the MATURE CONSEQUENCES list)',
  ),
});

// ── Shared test IDs ───────────────────────────────────────────────────────

let playthroughId: string;
let chapterId: string;
let nonExistentChapterId: string;

describe('makePlantConsequenceTool', () => {
  beforeEach(async () => {
    playthroughId = new mongoose.Types.ObjectId().toString();
    const arcId = new mongoose.Types.ObjectId();
    nonExistentChapterId = new mongoose.Types.ObjectId().toString();

    const chapter = await Chapter.create({
      playthroughId,
      arcId,
      chapterIndex: 3,
      status: 'completed',
    });
    chapterId = String(chapter._id);
  });

  // ── Tool creation ──────────────────────────────────────────────────────

  it('returns a tool object with description, inputSchema, and execute', () => {
    const tool = makePlantConsequenceTool(playthroughId, chapterId);

    expect(tool).toBeDefined();
    expect(typeof tool.description).toBe('string');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  // ── inputSchema validation ─────────────────────────────────────────────

  describe('inputSchema validation', () => {
    it('accepts valid input with all fields', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Player spared the assassin Kael',
        minChapterDelay: 5,
        impact: 'major',
        tags: ['mercy', 'assassin'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid input with minimal fields (defaults)', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Player found a mysterious key',
        impact: 'minor',
        tags: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minChapterDelay).toBe(3);
      }
    });

    it('rejects input missing description', () => {
      const result = plantConsequenceInputSchema.safeParse({
        minChapterDelay: 5,
        impact: 'major',
        tags: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects input missing impact', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Something happened',
        minChapterDelay: 3,
        tags: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects input missing tags', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Something happened',
        minChapterDelay: 3,
        impact: 'minor',
      });
      expect(result.success).toBe(false);
    });

    it('rejects minChapterDelay below 1', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Something happened',
        minChapterDelay: 0,
        impact: 'minor',
        tags: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects minChapterDelay above 20', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Something happened',
        minChapterDelay: 21,
        impact: 'minor',
        tags: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid impact value', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Something happened',
        minChapterDelay: 5,
        impact: 'catastrophic',
        tags: [],
      });
      expect(result.success).toBe(false);
    });

    it('applies default minChapterDelay when omitted', () => {
      const result = plantConsequenceInputSchema.safeParse({
        description: 'Something happened',
        impact: 'minor',
        tags: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minChapterDelay).toBe(3);
      }
    });
  });

  // ── execute success ────────────────────────────────────────────────────

  describe('execute', () => {
    it('creates a ConsequenceSeed with correct fields', async () => {
      const tool = makePlantConsequenceTool(playthroughId, chapterId);
      const result = await tool.execute!({
        description: 'Player spared the assassin Kael',
        minChapterDelay: 5,
        impact: 'major',
        tags: ['mercy', 'assassin'],
      }, {} as any) as any;

      expect(result.planted).toBe(true);
      expect(result.description).toBe('Player spared the assassin Kael');
      expect(result.minChapterDelay).toBe(5);
      expect(result.impact).toBe('major');

      const seeds = await ConsequenceSeed.find({ playthroughId });
      expect(seeds).toHaveLength(1);
      expect(seeds[0]!.description).toBe('Player spared the assassin Kael');
      expect(seeds[0]!.minChapterDelay).toBe(5);
      expect(seeds[0]!.impact).toBe('major');
      expect(seeds[0]!.tags).toEqual(['mercy', 'assassin']);
      expect(String(seeds[0]!.triggerChapterId)).toBe(chapterId);
      expect(seeds[0]!.triggerChapterIndex).toBe(3);
      expect(seeds[0]!.activated).toBe(false);
    });

    it('stores the playthroughId on the seed', async () => {
      const tool = makePlantConsequenceTool(playthroughId, chapterId);
      await tool.execute!({
        description: 'Player took a cursed amulet',
        minChapterDelay: 2,
        impact: 'critical',
        tags: ['cursed', 'amulet'],
      }, {} as any) as any;

      const seed = await ConsequenceSeed.findOne({ playthroughId });
      expect(seed).toBeDefined();
      expect(String(seed!.playthroughId)).toBe(playthroughId);
    });

    it('stores triggerChapterIndex from the Chapter document', async () => {
      // Create a chapter with a specific high index
      const arcId = new mongoose.Types.ObjectId();
      const ch = await Chapter.create({
        playthroughId,
        arcId,
        chapterIndex: 42,
        status: 'completed',
      });

      const tool = makePlantConsequenceTool(playthroughId, String(ch._id));
      await tool.execute!({
        description: 'Late-game event',
        minChapterDelay: 10,
        impact: 'critical',
        tags: ['late'],
      }, {} as any) as any;

      const seed = await ConsequenceSeed.findOne({ triggerChapterId: ch._id });
      expect(seed).toBeDefined();
      expect(seed!.triggerChapterIndex).toBe(42);
    });

    it('returns full output matching plantConsequenceOutput shape', async () => {
      const tool = makePlantConsequenceTool(playthroughId, chapterId);
      const result = await tool.execute!({
        description: 'Player made a promise to the king',
        minChapterDelay: 4,
        impact: 'major',
        tags: ['promise', 'royalty'],
      }, {} as any) as any;

      expect(result).toEqual({
        planted: true,
        description: 'Player made a promise to the king',
        minChapterDelay: 4,
        impact: 'major',
      });
    });

    it('allows multiple seeds in same playthrough', async () => {
      const tool = makePlantConsequenceTool(playthroughId, chapterId);

      await tool.execute!({
        description: 'Seed one',
        minChapterDelay: 3,
        impact: 'minor',
        tags: ['tag1'],
      }, {} as any) as any;
      await tool.execute!({
        description: 'Seed two',
        minChapterDelay: 7,
        impact: 'major',
        tags: ['tag2'],
      }, {} as any) as any;
      await tool.execute!({
        description: 'Seed three',
        minChapterDelay: 2,
        impact: 'critical',
        tags: ['tag3'],
      }, {} as any) as any;

      const seeds = await ConsequenceSeed.find({ playthroughId });
      expect(seeds).toHaveLength(3);
    });

    it('uses validated input with default minChapterDelay', async () => {
      const tool = makePlantConsequenceTool(playthroughId, chapterId);
      const input = plantConsequenceInputSchema.parse({
        description: 'Player found a strange herb',
        impact: 'minor',
        tags: ['herb'],
      });

      const result = await tool.execute!(input, {} as any) as any;

      expect(result.planted).toBe(true);
      expect(result.minChapterDelay).toBe(3);

      const seed = await ConsequenceSeed.findOne({ description: 'Player found a strange herb' });
      expect(seed).toBeDefined();
      expect(seed!.minChapterDelay).toBe(3);
    });
  });

  // ── execute error: Chapter not found ───────────────────────────────────

  describe('execute when Chapter not found', () => {
    it('returns { planted: false, error }', async () => {
      const tool = makePlantConsequenceTool(playthroughId, nonExistentChapterId);
      const result = await tool.execute!({
        description: 'Player spared the assassin',
        minChapterDelay: 5,
        impact: 'major',
        tags: ['mercy'],
      }, {} as any) as any;

      expect(result.planted).toBe(false);
      expect(result.error).toBe('Chapter not found');
    });

    it('does not create a ConsequenceSeed', async () => {
      const tool = makePlantConsequenceTool(playthroughId, nonExistentChapterId);
      await tool.execute!({
        description: 'Player spared the assassin',
        minChapterDelay: 5,
        impact: 'major',
        tags: ['mercy'],
      }, {} as any) as any;

      const seeds = await ConsequenceSeed.find({ playthroughId });
      expect(seeds).toHaveLength(0);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────

describe('makeActivateConsequenceTool', () => {
  let playthroughId2: string;
  let chapterId2: string;
  let nonExistentChapterId2: string;

  beforeEach(async () => {
    playthroughId2 = new mongoose.Types.ObjectId().toString();
    const arcId = new mongoose.Types.ObjectId();
    nonExistentChapterId2 = new mongoose.Types.ObjectId().toString();

    const chapter = await Chapter.create({
      playthroughId: playthroughId2,
      arcId,
      chapterIndex: 5,
      status: 'completed',
    });
    chapterId2 = String(chapter._id);
  });

  // ── Tool creation ──────────────────────────────────────────────────────

  it('returns a tool object with description, inputSchema, and execute', () => {
    const tool = makeActivateConsequenceTool(playthroughId2, chapterId2);

    expect(tool).toBeDefined();
    expect(typeof tool.description).toBe('string');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  // ── inputSchema validation ─────────────────────────────────────────────

  describe('inputSchema validation', () => {
    it('accepts a valid consequenceDescription string', () => {
      const result = activateConsequenceInputSchema.safeParse({
        consequenceDescription: 'The assassin Kael returns',
      });
      expect(result.success).toBe(true);
    });

    it('rejects input missing consequenceDescription', () => {
      const result = activateConsequenceInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects input with wrong field name', () => {
      const result = activateConsequenceInputSchema.safeParse({
        description: 'Wrong field name',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-string consequenceDescription', () => {
      const result = activateConsequenceInputSchema.safeParse({
        consequenceDescription: 123,
      });
      expect(result.success).toBe(false);
    });
  });

  // ── execute success ────────────────────────────────────────────────────

  describe('execute', () => {
    beforeEach(async () => {
      // Plant a seed that can be activated
      await ConsequenceSeed.create({
        playthroughId: playthroughId2,
        triggerChapterId: chapterId2,
        triggerChapterIndex: 5,
        description: 'The assassin Kael returns to confront the player',
        minChapterDelay: 3,
        impact: 'major',
        tags: ['assassin', 'revenge'],
      });
    });

    it('finds and activates a matching ConsequenceSeed by partial description', async () => {
      const tool = makeActivateConsequenceTool(playthroughId2, chapterId2);
      const result = await tool.execute!({
        consequenceDescription: 'Kael returns to confront',
      }, {} as any) as any;

      expect(result.activated).toBe(true);
      expect(result.description).toBe('The assassin Kael returns to confront the player');
      expect(result.impact).toBe('major');

      // Verify seed is now activated in DB
      const seed = await ConsequenceSeed.findOne({
        playthroughId: playthroughId2,
        description: 'The assassin Kael returns to confront the player',
      });
      expect(seed).toBeDefined();
      expect(seed!.activated).toBe(true);
      expect(seed!.activatedInChapterId).toBeDefined();
      expect(String(seed!.activatedInChapterId)).toBe(chapterId2);
    });

    it('marks activatedInChapterId with the chapterId passed to the tool', async () => {
      // Create a different chapter for activation
      const arcId = new mongoose.Types.ObjectId();
      const activateChapter = await Chapter.create({
        playthroughId: playthroughId2,
        arcId,
        chapterIndex: 8,
        status: 'completed',
      });

      const tool = makeActivateConsequenceTool(playthroughId2, String(activateChapter._id));
      await tool.execute!({
        consequenceDescription: 'Kael',
      }, {} as any) as any;

      const seed = await ConsequenceSeed.findOne({
        playthroughId: playthroughId2,
        description: 'The assassin Kael returns to confront the player',
      });
      expect(seed).toBeDefined();
      expect(String(seed!.activatedInChapterId)).toBe(String(activateChapter._id));
    });

    it('skips already-activated seeds (activated: false filter)', async () => {
      // Create an already-activated seed with a matching description
      await ConsequenceSeed.create({
        playthroughId: playthroughId2,
        triggerChapterId: chapterId2,
        triggerChapterIndex: 5,
        description: 'A rival guild was angered',
        minChapterDelay: 2,
        impact: 'minor',
        tags: ['rivalry'],
        activated: true,
        activatedInChapterId: chapterId2,
      });

      const tool = makeActivateConsequenceTool(playthroughId2, chapterId2);
      const result = await tool.execute!({
        consequenceDescription: 'rival guild',
      }, {} as any) as any;

      // The query filters activated: false, so the already-activated rival guild
      // seed is skipped. No other inactive seed matches "rival guild" → no match.
      expect(result.activated).toBe(false);
      expect(result.error).toBe('Consequence seed not found or already activated');
    });

    it('uses regex partial match on first 50 chars', async () => {
      const tool = makeActivateConsequenceTool(playthroughId2, chapterId2);
      const result = await tool.execute!({
        consequenceDescription: 'assassin Kael',
      }, {} as any) as any;

      expect(result.activated).toBe(true);
      expect(result.description).toContain('Kael');
    });
  });

  // ── execute: no match found ────────────────────────────────────────────

  describe('execute when no matching seed', () => {
    it('returns { activated: false, error }', async () => {
      const tool = makeActivateConsequenceTool(playthroughId2, chapterId2);
      const result = await tool.execute!({
        consequenceDescription: 'something that was never planted',
      }, {} as any) as any;

      expect(result.activated).toBe(false);
      expect(result.error).toBe('Consequence seed not found or already activated');
    });

    it('returns { activated: false } when playthrough has no seeds at all', async () => {
      const tool = makeActivateConsequenceTool(playthroughId2, chapterId2);
      const result = await tool.execute!({
        consequenceDescription: 'any description',
      }, {} as any) as any;

      expect(result.activated).toBe(false);
      expect(result.error).toBe('Consequence seed not found or already activated');
    });

    it('returns { activated: false } when description has no overlap', async () => {
      // Plant a seed
      await ConsequenceSeed.create({
        playthroughId: playthroughId2,
        triggerChapterId: chapterId2,
        triggerChapterIndex: 5,
        description: 'The player befriended a stray dog',
        minChapterDelay: 3,
        impact: 'minor',
        tags: ['animal'],
      });

      const tool = makeActivateConsequenceTool(playthroughId2, chapterId2);
      const result = await tool.execute!({
        consequenceDescription: 'completely different topic nothing alike',
      }, {} as any) as any;

      expect(result.activated).toBe(false);
    });
  });
});

// ── Cross-tool interaction ────────────────────────────────────────────────

describe('plant + activate lifecycle', () => {
  it('planted seed can be activated in same playthrough', async () => {
    const playthroughId3 = new mongoose.Types.ObjectId().toString();
    const arcId = new mongoose.Types.ObjectId();

    const plantChapter = await Chapter.create({
      playthroughId: playthroughId3,
      arcId,
      chapterIndex: 1,
      status: 'completed',
    });
    const plantChapterId = String(plantChapter._id);

    const activateChapter = await Chapter.create({
      playthroughId: playthroughId3,
      arcId,
      chapterIndex: 10,
      status: 'completed',
    });
    const activateChapterId = String(activateChapter._id);

    // 1. Plant
    const plantTool = makePlantConsequenceTool(playthroughId3, plantChapterId);
    const plantResult = await plantTool.execute!({
      description: 'Player buried treasure under the old oak tree',
      minChapterDelay: 5,
      impact: 'major',
      tags: ['treasure', 'secret'],
    }, {} as any) as any;
    expect(plantResult.planted).toBe(true);

    // 2. Activate
    const activateTool = makeActivateConsequenceTool(playthroughId3, activateChapterId);
    const activateResult = await activateTool.execute!({
      consequenceDescription: 'buried treasure under the old oak',
    }, {} as any) as any;
    expect(activateResult.activated).toBe(true);
    expect(activateResult.description).toBe('Player buried treasure under the old oak tree');
    expect(activateResult.impact).toBe('major');
  });

  it('seed remains inactive if not explicitly activated', async () => {
    const playthroughId4 = new mongoose.Types.ObjectId().toString();
    const arcId = new mongoose.Types.ObjectId();

    const chapter = await Chapter.create({
      playthroughId: playthroughId4,
      arcId,
      chapterIndex: 1,
      status: 'completed',
    });

    const tool = makePlantConsequenceTool(playthroughId4, String(chapter._id));
    await tool.execute!({
      description: 'An ancient prophecy was spoken',
      minChapterDelay: 10,
      impact: 'critical',
      tags: ['prophecy'],
    }, {} as any) as any;

    const seed = await ConsequenceSeed.findOne({ playthroughId: playthroughId4 });
    expect(seed).toBeDefined();
    expect(seed!.activated).toBe(false);
    expect(seed!.activatedInChapterId).toBeUndefined();
  });

  it('seeds in different playthroughs do not interfere', async () => {
    const pt1 = new mongoose.Types.ObjectId().toString();
    const pt2 = new mongoose.Types.ObjectId().toString();
    const arcId = new mongoose.Types.ObjectId();

    const ch1 = await Chapter.create({ playthroughId: pt1, arcId, chapterIndex: 1, status: 'completed' });
    const ch2 = await Chapter.create({ playthroughId: pt2, arcId, chapterIndex: 1, status: 'completed' });

    // Plant similar seeds in both playthroughs
    await makePlantConsequenceTool(pt1, String(ch1._id)).execute!({
      description: 'A shared description seed', minChapterDelay: 3, impact: 'minor',
      tags: [],
    }, {} as any) as any;
    await makePlantConsequenceTool(pt2, String(ch2._id)).execute!({
      description: 'A shared description seed', minChapterDelay: 3, impact: 'minor',
      tags: [],
    }, {} as any) as any;

    // Activate in pt1 only
    const activateTool = makeActivateConsequenceTool(pt1, String(ch1._id));
    await activateTool.execute!({
      consequenceDescription: 'shared description seed',
    }, {} as any) as any;

    // pt1 seed should be activated
    const pt1Seed = await ConsequenceSeed.findOne({ playthroughId: pt1 });
    expect(pt1Seed!.activated).toBe(true);

    // pt2 seed should remain inactive
    const pt2Seed = await ConsequenceSeed.findOne({ playthroughId: pt2 });
    expect(pt2Seed!.activated).toBe(false);
  });
});
