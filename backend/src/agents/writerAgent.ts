import { streamText, stepCountIs } from 'ai';
import type { LanguageModel } from 'ai';
import type { ContextOutput } from './contextAgent';
import { makeCreateCharacterTool } from '../tools/createCharacter';
import { makeCreateItemTool } from '../tools/createItem';
import { makeUpdateStatsTool } from '../tools/updateStats';
import { makeSummarizeArcTool } from '../tools/summarizeArc';
import { makeGenerateChoicesTool } from '../tools/generateChoices';

export interface WriterAgentParams {
  contextOutput: ContextOutput;
  playthroughId: string;
  arcId: string;
  chapterId: string;
  worldId: string;
  userId: string;
  model: LanguageModel;
  language: string;
  maxSteps?: number;
  abortSignal?: AbortSignal;
}

const SYSTEM_PROMPT = `You are a master storyteller writing an immersive interactive novel. Write the next chapter based on the context provided.

Rules:
- Write vivid, engaging prose that draws the reader into the story
- Use your tools to create new characters and items as the story demands
- Use updateStats when story events affect character attributes
- Use summarizeArc ONLY when a major story arc has concluded
- You MUST call generateChoices at the end with 3-4 meaningful options for the reader
- Each choice should lead to a genuinely different narrative path
- Keep the chapter between 800-1500 words`;

export function runWriterAgent(
  params: WriterAgentParams
) {
  const {
    contextOutput,
    playthroughId,
    arcId,
    chapterId,
    worldId,
    userId,
    model,
    language,
    maxSteps = 5,
    abortSignal,
  } = params;

  // Build tools
  const tools = {
    createCharacter: makeCreateCharacterTool(playthroughId, worldId, userId),
    createItem: makeCreateItemTool(playthroughId, userId),
    updateStats: makeUpdateStatsTool(playthroughId, userId),
    summarizeArc: makeSummarizeArcTool(),
    generateChoices: makeGenerateChoicesTool(chapterId),
  };

  // Format context for prompt
  const userPrompt = `
Write the next chapter in ${language}.

=== STORY CONTEXT ===
Outline: ${contextOutput.outline}

Scene: ${contextOutput.currentScene}

Active Characters: ${contextOutput.activeCharacters.join(', ') || 'None specified'}

Relevant Plot Points:
${contextOutput.relevantPlotPoints.map((p) => `- ${p}`).join('\n') || '- None'}

Filtered Context:
${contextOutput.filteredContext}

=== INSTRUCTIONS ===
Write the next chapter based on the context above. Remember to:
1. Create any new characters or items as needed using your tools
2. Update character stats if story events warrant it
3. Call generateChoices at the end with 3-4 meaningful options
`.trim();

  // Call streamText with tools
  const result = streamText({
    model,
    system: `${SYSTEM_PROMPT}\nWrite in ${language}.`,
    prompt: userPrompt,
    tools,
    stopWhen: stepCountIs(maxSteps),
    abortSignal,
  });

  return result;
}
