import { streamText, stepCountIs, type StreamTextResult } from 'ai';
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
- Use updateStats when story events affect character attributes — values MUST match the stat's data type (number for number stats, string for text stats, 0-100 for progress stats)
- Use summarizeArc ONLY when a major story arc has concluded
- You MUST call generateChoices at the end with 3-4 meaningful options for the reader
- Each choice should lead to a genuinely different narrative path
- Keep the chapter between 800-1500 words

CRITICAL CONSTRAINTS:
- NEVER use createCharacter for a character that already exists in the EXISTING CHARACTERS list below. Reference them by name directly in the story.
- Only use createCharacter for genuinely NEW characters appearing for the first time.
- When using updateStats, the value must be appropriate for the stat type: numbers for 'number' type, 0-100 for 'progress' type, text for 'text' type.
- When calling createSpecialItem, the 'category' field MUST be written in the story's language (specified below). For example, if writing in Vietnamese, use 'Kỹ năng' not 'Skill', 'Công pháp' not 'Technique'. Same applies to item names and character names — ALL tool arguments must match the story language.

ENTITY MARKUP (REQUIRED):
When mentioning characters, items, or special items in the story text, wrap them in special markup so the frontend can highlight them:
- Characters: [[char:CharacterName]]
- Items: [[item:ItemName:rarity]]  (rarity = common|uncommon|rare|epic|legendary)
- Special Items: [[special:ItemName:rarity]]
Examples: "[[char:Vương Quân]] drew the [[item:Flame Sword:epic]] and channeled his [[special:Dragon Breath:legendary]] technique."
Only use this markup for entities that exist or are being created in this chapter. Do NOT markup generic nouns.

Available tools:
- createCharacter: Create a NEW NPC character (NEVER for existing characters)
- createItem: Create a new physical item (weapon, potion, artifact, etc.) with rarity
- createSpecialItem: Create a special item (skill, technique, spiritual root, ability, etc.) with category and rarity. The category name MUST be in the story's language.
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

  // Format context for prompt — include existing character names to prevent duplication
  const existingCharacters = contextOutput.activeCharacters;

  // Build structured item reference for accurate markup
  const existingItemsBlock = contextOutput.existingItems.length > 0
    ? contextOutput.existingItems.map(i => `- ${i.name} (${i.rarity})${i.owner ? ` [owned by ${i.owner}]` : ''}`).join('\n')
    : 'No items yet.';

  const existingSpecialItemsBlock = contextOutput.existingSpecialItems.length > 0
    ? contextOutput.existingSpecialItems.map(si => `- ${si.name} [${si.category}] (${si.rarity})${si.owner ? ` [owned by ${si.owner}]` : ''}`).join('\n')
    : 'No special items yet.';

  const userPrompt = `
Write the next chapter in ${language}.

=== STORY CONTEXT ===
Outline: ${contextOutput.outline}

Scene: ${contextOutput.currentScene}

Active Characters: ${existingCharacters.join(', ') || 'None specified'}

Relevant Plot Points:
${contextOutput.relevantPlotPoints.map((p) => `- ${p}`).join('\n') || '- None'}

Filtered Context:
${contextOutput.filteredContext}

=== EXISTING CHARACTERS (DO NOT recreate with createCharacter) ===
${existingCharacters.length > 0 ? existingCharacters.map(c => `- ${c}`).join('\n') : 'No characters yet — you may create new ones.'}

=== EXISTING ITEMS (USE EXACT rarity when mentioning with [[item:Name:rarity]] markup) ===
${existingItemsBlock}

=== EXISTING SPECIAL ITEMS (USE EXACT rarity when mentioning with [[special:Name:rarity]] markup) ===
${existingSpecialItemsBlock}

=== INSTRUCTIONS ===
Write the next chapter based on the context above. Remember to:
1. ONLY use createCharacter for genuinely NEW characters. NEVER call createCharacter for: ${existingCharacters.join(', ') || 'N/A'}
2. NEVER use createItem for items that already exist above. Reference them by name using [[item:Name:rarity]] with the EXACT rarity listed above
3. NEVER use createSpecialItem for special items that already exist above. Reference them using [[special:Name:rarity]] with the EXACT rarity listed above
4. Create NEW items (weapons, potions, artifacts) using createItem with appropriate rarity
5. Create NEW special items (skills, techniques, abilities) using createSpecialItem with category and rarity when characters learn/acquire them
6. Update character stats if story events warrant it using updateStats — values must match data types
7. Use [[char:Name]], [[item:Name:rarity]], [[special:Name:rarity]] markup when mentioning entities in the story text
8. Call generateChoices at the end with 3-4 meaningful options
`.trim();

  // Call streamText with tools — onFinish persists content to DB
  const result = streamText({
    model,
    system: `${SYSTEM_PROMPT}\nWrite in ${language}.`,
    prompt: userPrompt,
    tools,
    stopWhen: stepCountIs(maxSteps),
    abortSignal,
    async onFinish({ text }) {
      // Persist generated content to the chapter document
      if (text) {
        const { Chapter } = await import('../models/Chapter');
        await Chapter.findByIdAndUpdate(chapterId, { content: text });
      }
    },
  });

  return result;
}
