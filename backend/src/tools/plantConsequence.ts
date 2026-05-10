import mongoose from 'mongoose';
import { tool } from 'ai';
import { z } from 'zod';
import { ConsequenceSeed } from '../models/ConsequenceSeed';
import { Chapter } from '../models/Chapter';
import { plantConsequenceOutput, activateConsequenceOutput, validateToolOutput } from './schemas';

export function makePlantConsequenceTool(playthroughId: string, chapterId: string) {
  return tool({
    description:
      'Plant a consequence seed — a story event whose effects will surface later (3-10 chapters in the future). Use for: sparing an enemy, making a promise, acquiring a cursed item, offending a powerful figure, etc. The AI will be reminded of mature seeds in future chapters.',
    inputSchema: z.object({
      description: z
        .string()
        .describe('What happened and what the future consequence should be. Be specific. E.g. "Player spared the assassin Kael — Kael may return to help or betray later"'),
      minChapterDelay: z
        .number()
        .min(1)
        .max(20)
        .default(3)
        .describe('Minimum number of chapters before this consequence can activate (1-20, default 3)'),
      impact: z
        .enum(['minor', 'major', 'critical'])
        .describe('How significant the consequence will be when it activates'),
      tags: z
        .array(z.string())
        .describe('Tags for categorization, e.g. ["mercy", "assassin", "debt"]'),
    }),
    execute: async ({ description, minChapterDelay, impact, tags }) => {
      // Get current chapter index
      const chapter = await Chapter.findById(chapterId).lean();
      if (!chapter) return validateToolOutput({ planted: false, error: 'Chapter not found' }, plantConsequenceOutput, 'plantConsequence');

      await ConsequenceSeed.create({
        playthroughId,
        triggerChapterId: chapterId,
        triggerChapterIndex: chapter.chapterIndex,
        description,
        minChapterDelay,
        impact,
        tags,
      });

      return validateToolOutput({ planted: true, description, minChapterDelay, impact }, plantConsequenceOutput, 'plantConsequence');
    },
  });
}

export function makeActivateConsequenceTool(playthroughId: string, chapterId: string) {
  return tool({
    description:
      'Mark a consequence seed as activated — call this when you incorporate a mature consequence into the current chapter.',
    inputSchema: z.object({
      consequenceDescription: z
        .string()
        .describe('The description of the consequence seed being activated (match it from the MATURE CONSEQUENCES list)'),
    }),
    execute: async ({ consequenceDescription }) => {
      // Find by partial match on description
      const seed = await ConsequenceSeed.findOne({
        playthroughId,
        activated: false,
        description: { $regex: consequenceDescription.slice(0, 50), $options: 'i' },
      });

      if (!seed) return validateToolOutput({ activated: false, error: 'Consequence seed not found or already activated' }, activateConsequenceOutput, 'activateConsequence');

      seed.activated = true;
      seed.activatedInChapterId = new mongoose.Types.ObjectId(chapterId);
      await seed.save();

      return validateToolOutput({ activated: true, description: seed.description, impact: seed.impact }, activateConsequenceOutput, 'activateConsequence');
    },
  });
}
