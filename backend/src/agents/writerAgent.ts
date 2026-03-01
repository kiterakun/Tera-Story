import { streamText, stepCountIs } from 'ai';
import type { LanguageModel } from 'ai';
import type { ContextOutput } from './contextAgent';
import { makeCreateCharacterTool } from '../tools/createCharacter';
import { makeCreateItemTool } from '../tools/createItem';
import { makeCreateSpecialItemTool } from '../tools/createSpecialItem';
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
- Use createSpecialItem to grant skills, techniques, abilities, or other special items to characters when the story warrants it
- Assign appropriate rarity tiers: common (basic), uncommon (notable), rare (powerful), epic (extraordinary), legendary (mythical)
- Use updateStats when story events affect character attributes
- Use summarizeArc ONLY when a major story arc has concluded
- You MUST call generateChoices at the end with 3-4 meaningful options for the reader
- Each choice should lead to a genuinely different narrative path
- Keep the chapter between 800-1500 words

Available tools:
- createCharacter: Create a new NPC character
- createItem: Create a new physical item (weapon, potion, artifact, etc.) with rarity
- createSpecialItem: Create a special item (skill, technique, spiritual root, ability, etc.) with category and rarity
- updateStats: Update character statistics after events
- summarizeArc: Mark an arc as complete with summary
- generateChoices: REQUIRED — set reader choices at end of chapter`;

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
    maxSteps = 8,
    abortSignal,
  } = params;

  // Build tools
  const tools = {
    createCharacter: makeCreateCharacterTool(playthroughId, worldId, userId),
    createItem: makeCreateItemTool(playthroughId, userId),
    createSpecialItem: makeCreateSpecialItemTool(playthroughId, userId),
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
1. Create any new characters as needed using createCharacter
2. Create items (weapons, potions, artifacts) using createItem with appropriate rarity
3. Create special items (skills, techniques, abilities) using createSpecialItem with category and rarity when characters learn/acquire them
4. Update character stats if story events warrant it using updateStats
5. Call generateChoices at the end with 3-4 meaningful options
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
