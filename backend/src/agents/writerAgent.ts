import { streamText, stepCountIs } from 'ai';
import type { LanguageModel } from 'ai';
import type { ContextOutput } from './contextAgent';
import { makeCreateCharacterTool } from '../tools/createCharacter';
import { makeCreateItemTool } from '../tools/createItem';
import { makeCreateSpecialItemTool } from '../tools/createSpecialItem';
import { makeUpdateStatsTool } from '../tools/updateStats';
import { makeUpdateEntityStatusTool } from '../tools/updateEntityStatus';
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
}

const SYSTEM_PROMPT = `You are a master storyteller writing an immersive interactive novel. Write the next chapter based on the context provided.

Rules:
- Write vivid, engaging prose that draws the reader into the story
- Use your tools to create new characters and items as the story demands
- Use createSpecialItem to grant skills, techniques, abilities, or other special items to characters when the story warrants it
- Assign appropriate rarity tiers: common (basic), uncommon (notable), rare (powerful), epic (extraordinary), legendary (mythical)
- Use updateStats when story events affect character attributes — values MUST match the stat's data type (number for number stats, string for text stats, 0-100 for progress stats)
- Use updateEntityStatus when story events change an entity's state (character dies/injured/goes missing, item destroyed/lost/consumed, ability sealed/lost/consumed)
- Use summarizeArc ONLY when a major story arc has concluded
- You MUST call generateChoices at the end with 3-4 meaningful options for the reader
- Each choice should lead to a genuinely different narrative path
- Keep the chapter between 800-1500 words

CRITICAL CONSTRAINTS:
- NEVER use createCharacter for a character that already exists in the EXISTING CHARACTERS list below. Reference them by name directly in the story.
- Only use createCharacter for genuinely NEW characters appearing for the first time.
- When using updateStats, the value must be appropriate for the stat type: numbers for 'number' type, 0-100 for 'progress' type, text for 'text' type.
- When calling createSpecialItem, the 'category' field MUST match one of the AVAILABLE SPECIAL ITEM CATEGORIES listed in the prompt below. Do NOT invent new categories. The category name MUST be in the story's language (specified below). ALL tool arguments must match the story language.
- Characters with status 'dead' MUST NOT appear alive in the story. Characters with status 'injured' should reflect their injuries. Characters with status 'missing' are absent from the scene.
- Items/special items with status 'destroyed', 'consumed', 'lost', or 'sealed' MUST NOT be used as if they still exist. Reference them only in past tense or memories.

ENTITY STATUS MANAGEMENT:
- When a character DIES in the story → call updateEntityStatus('character', name, 'dead')
- When a character is SERIOUSLY INJURED → call updateEntityStatus('character', name, 'injured')
- When a character DISAPPEARS/GOES MISSING → call updateEntityStatus('character', name, 'missing')
- When an injured/missing character RECOVERS → call updateEntityStatus('character', name, 'active')
- When an item is DESTROYED → call updateEntityStatus('item', name, 'destroyed')
- When an item is LOST → call updateEntityStatus('item', name, 'lost')
- When an item is CONSUMED/USED UP → call updateEntityStatus('item', name, 'consumed')
- When a special ability is SEALED/BLOCKED → call updateEntityStatus('special-item', name, 'sealed')
- When a special ability is LOST → call updateEntityStatus('special-item', name, 'lost')
- When a special ability is CONSUMED → call updateEntityStatus('special-item', name, 'consumed')

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
- createSpecialItem: Create a special item (skill, technique, spiritual root, ability, etc.) with category and rarity. The category MUST match one of the world's defined template categories.
- updateStats: Update character statistics after events
- updateEntityStatus: Update an entity's status when story events change their state (death, destruction, loss, etc.)
- summarizeArc: Mark an arc as complete with summary
- generateChoices: REQUIRED — set reader choices at end of chapter`;

export async function runWriterAgent(
  params: WriterAgentParams
): Promise<{ text: string }> {
  const {
    contextOutput,
    playthroughId,
    arcId,
    chapterId,
    worldId,
    userId,
    model,
    language,
    maxSteps = 10,
  } = params;

  // Build tools
  const tools = {
    createCharacter: makeCreateCharacterTool(playthroughId, worldId, userId),
    createItem: makeCreateItemTool(playthroughId, userId),
    createSpecialItem: makeCreateSpecialItemTool(playthroughId, userId),
    updateStats: makeUpdateStatsTool(playthroughId, userId),
    updateEntityStatus: makeUpdateEntityStatusTool(playthroughId),
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

  // Build available template categories block
  const templateCategoriesBlock = contextOutput.specialItemTemplateCategories.length > 0
    ? contextOutput.specialItemTemplateCategories.map(t => `- ${t.category}: ${t.description}`).join('\n')
    : 'No special item categories defined.';

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
${existingCharacters.length > 0 ? existingCharacters.map(c => `- ${c}`).join('\n') : 'No characters yet \u2014 you may create new ones.'}

=== EXISTING ITEMS (USE EXACT rarity when mentioning with [[item:Name:rarity]] markup) ===
${existingItemsBlock}

=== EXISTING SPECIAL ITEMS (USE EXACT rarity when mentioning with [[special:Name:rarity]] markup) ===
${existingSpecialItemsBlock}

=== AVAILABLE SPECIAL ITEM CATEGORIES (MUST use one of these when calling createSpecialItem) ===
${templateCategoriesBlock}

=== INSTRUCTIONS ===
Write the next chapter based on the context above. Remember to:
1. ONLY use createCharacter for genuinely NEW characters. NEVER call createCharacter for: ${existingCharacters.join(', ') || 'N/A'}
2. NEVER use createItem for items that already exist above. Reference them by name using [[item:Name:rarity]] with the EXACT rarity listed above
3. NEVER use createSpecialItem for special items that already exist above. Reference them using [[special:Name:rarity]] with the EXACT rarity listed above
4. Create NEW items (weapons, potions, artifacts) using createItem with appropriate rarity
5. Create NEW special items using createSpecialItem \u2014 the category MUST be one of the AVAILABLE SPECIAL ITEM CATEGORIES listed above
6. Update character stats if story events warrant it using updateStats \u2014 values must match data types
7. Use [[char:Name]], [[item:Name:rarity]], [[special:Name:rarity]] markup when mentioning entities in the story text
8. Call generateChoices at the end with 3-4 meaningful options
`.trim();

  // Use streamText + await full result — streaming API calls are more compatible
  // with third-party/OpenAI-compatible providers than generateText (stream: false).
  // We don't pipe to response — just consume the full text after all steps complete.
  const stream = streamText({
    model,
    system: `${SYSTEM_PROMPT}\nWrite in ${language}.`,
    prompt: userPrompt,
    tools,
    stopWhen: stepCountIs(maxSteps),
  });

  // Await the full text — resolves after all tool call steps + final text generation
  const fullText = await stream.text;

  // Persist generated content to the chapter document
  const { Chapter } = await import('../models/Chapter');
  await Chapter.findByIdAndUpdate(chapterId, {
    content: fullText,
    status: 'completed',
  });

  return { text: fullText };
}
