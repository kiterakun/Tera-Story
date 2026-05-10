import { tool } from 'ai';
import { z } from 'zod';
import { Chapter } from '../models/Chapter';
import { generateChoicesOutput, validateToolOutput } from './schemas';

export function makeGenerateChoicesTool(chapterId: string) {
  return tool({
    description:
      'Set the choices available to the reader at the end of the chapter',
    inputSchema: z.object({
      choices: z
        .array(
          z.object({
            text: z.string().describe('The choice text shown to the reader'),
            type: z
              .enum(['continue', 'new_arc', 'custom'])
              .describe('The type of choice'),
          })
        )
        .describe('Array of 3-4 meaningful choices for the reader'),
    }),
    execute: async ({ choices }) => {
      await Chapter.findByIdAndUpdate(chapterId, { choices });

      return validateToolOutput({ choices }, generateChoicesOutput, 'generateChoices');
    },
  });
}
