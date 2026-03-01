import { tool } from 'ai';
import { z } from 'zod';
import { Arc } from '../models/Arc';

export function makeSummarizeArcTool() {
  return tool({
    description:
      'Summarize the current arc and mark it complete when the story arc concludes',
    inputSchema: z.object({
      arcId: z.string().describe('The arc ID to summarize'),
      summary: z
        .string()
        .describe('A concise summary of what happened in this arc'),
    }),
    execute: async ({ arcId, summary }) => {
      await Arc.findByIdAndUpdate(arcId, {
        summary,
        status: 'completed',
      });

      return { arcId, summarized: true };
    },
  });
}
