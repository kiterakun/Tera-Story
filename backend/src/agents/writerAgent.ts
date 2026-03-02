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
  /** If true, skip Pass 1 (prose) and only run Pass 2 (tools). Content must already exist in DB. */
  skipPass1?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Pass 1 — WRITE: Pure prose, no tools. Lean prompt focused on storytelling.
// ────────────────────────────────────────────────────────────────────────────

const WRITER_SYSTEM_PROMPT = `You are a master storyteller writing an immersive interactive novel. Write the next chapter as a single, complete piece of prose.

WRITING RULES:
- Write vivid, engaging prose that draws the reader into the story
- Keep the chapter between 800-1500 words
- Write the ENTIRE chapter in one continuous block — do not split or summarize
- Write naturally as a novel — no meta-commentary, no instructions to yourself

CHARACTER & ENTITY CONSISTENCY:
- Characters with status 'dead' MUST NOT appear alive. Characters with status 'injured' should reflect their injuries. Characters with status 'missing' are absent from the scene.
- Items/special items with status 'destroyed', 'consumed', 'lost', or 'sealed' MUST NOT be used as if they still exist. Reference them only in past tense or memories.
- You may introduce NEW characters, items, or abilities in the prose — they will be registered in the game system automatically after you finish writing.

ENTITY MARKUP (REQUIRED):
When mentioning characters, items, or special items in the story text, wrap them in special markup:
- Characters: [[char:CharacterName]]
- Items: [[item:ItemName:rarity]]  (rarity = common|uncommon|rare|epic|legendary)
- Special Items: [[special:ItemName:rarity]]
Examples: "[[char:Vương Quân]] drew the [[item:Flame Sword:epic]] and channeled his [[special:Dragon Breath:legendary]] technique."
- Use this markup for EXISTING entities (listed below) and any NEW entities you introduce in the chapter.
- Use the EXACT rarity listed for existing entities. For new entities, assign appropriate rarity: common (basic), uncommon (notable), rare (powerful), epic (extraordinary), legendary (mythical).
- Do NOT markup generic nouns — only named entities.`;

// ────────────────────────────────────────────────────────────────────────────
// Pass 2 — TOOLS: Read the finished chapter, execute all game-state changes.
// ────────────────────────────────────────────────────────────────────────────

const TOOLS_SYSTEM_PROMPT = `You are a game master analyzing a chapter that was just written for an interactive novel. Your job is to update the game state by calling the appropriate tools based on what happened in the chapter.

Read the chapter content carefully and call ALL necessary tools in a SINGLE step. Do NOT output any prose or story text — ONLY call tools.

TOOL CALLING RULES:

1. createCharacter — For each NEW character that appeared in the chapter (not in the EXISTING CHARACTERS list):
   - Provide name, description, role='npc'
   - MUST provide dynamicStats with meaningful values based on the character's role and strength in the story
   - NEVER create characters that already exist in EXISTING CHARACTERS

2. createItem — For each NEW item that appeared in the chapter (not in EXISTING ITEMS):
   - Provide name, description, rarity matching the [[item:Name:rarity]] markup used in the chapter

3. createSpecialItem — For each NEW special item/ability/skill that appeared (not in EXISTING SPECIAL ITEMS):
   - The category MUST match one of the AVAILABLE SPECIAL ITEM CATEGORIES
   - Provide customFields matching the category's field definitions
   - Category name MUST be in the story's language

4. updateStats — For each character whose stats changed during the chapter:
   - Reference CURRENT stat values and calculate realistic NEW values based on story events
   - Values must match data types: numbers for 'number'/'progress' type, strings for 'text'/'enum' type

5. updateEntityStatus — For state changes:
   - Character DIES → ('character', name, 'dead')
   - Character SERIOUSLY INJURED → ('character', name, 'injured')
   - Character DISAPPEARS → ('character', name, 'missing')
   - Character RECOVERS → ('character', name, 'active')
   - Item DESTROYED → ('item', name, 'destroyed')
   - Item LOST → ('item', name, 'lost')
   - Item CONSUMED → ('item', name, 'consumed')
   - Ability SEALED → ('special-item', name, 'sealed')
   - Ability LOST → ('special-item', name, 'lost')
   - Ability CONSUMED → ('special-item', name, 'consumed')

6. summarizeArc — ONLY if a major story arc has clearly concluded in this chapter

7. generateChoices (REQUIRED) — You MUST call this with 3-4 meaningful choices for the reader based on the chapter content. Each choice should lead to a genuinely different narrative path.

Call ALL applicable tools. If nothing changed (no new entities, no stat changes, no status changes), just call generateChoices.`;

// ────────────────────────────────────────────────────────────────────────────

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
    skipPass1 = false,
  } = params;

  // ── Shared context blocks ──

  const existingCharacters = contextOutput.activeCharacters;
  const existingCharacterNames = existingCharacters.map(c => c.name);

  const existingCharactersBlock = existingCharacters.length > 0
    ? existingCharacters.map(c => {
        const statsStr = Object.entries(c.dynamicStats).length > 0
          ? ` [Stats: ${Object.entries(c.dynamicStats).map(([k, v]) => `${k}=${v}`).join(', ')}]`
          : '';
        const statusTag = c.status && c.status !== 'active' ? ` [STATUS: ${c.status.toUpperCase()}]` : '';
        return `- ${c.name} (${c.role}${statusTag}): ${c.description}${statsStr}`;
      }).join('\n')
    : 'No characters yet — you may create new ones.';

  const existingItemsBlock = contextOutput.existingItems.length > 0
    ? contextOutput.existingItems.map(i => `- ${i.name} (${i.rarity})${i.owner ? ` [owned by ${i.owner}]` : ''}`).join('\n')
    : 'No items yet.';

  const existingSpecialItemsBlock = contextOutput.existingSpecialItems.length > 0
    ? contextOutput.existingSpecialItems.map(si => `- ${si.name} [${si.category}] (${si.rarity})${si.owner ? ` [owned by ${si.owner}]` : ''}`).join('\n')
    : 'No special items yet.';

  const templateCategoriesBlock = contextOutput.specialItemTemplateCategories.length > 0
    ? contextOutput.specialItemTemplateCategories.map(t => {
        const fieldsDesc = t.fields.length > 0
          ? `\n    Fields: ${t.fields.map(f => {
              let desc = `${f.name} (${f.type}`;
              if (f.options && f.options.length > 0) desc += `, options: ${f.options.join('|')}`;
              if (f.required) desc += ', required';
              desc += ')';
              return desc;
            }).join(', ')}`
          : '';
        return `- ${t.category}: ${t.description}${fieldsDesc}`;
      }).join('\n')
    : 'No special item categories defined.';

  const resourceTemplatesBlock = contextOutput.resourceTemplates.length > 0
    ? contextOutput.resourceTemplates.map(rt => {
        let desc = `- ${rt.key} (${rt.type}`;
        if (rt.min !== undefined) desc += `, min: ${rt.min}`;
        if (rt.max !== undefined) desc += `, max: ${rt.max}`;
        if (rt.defaultValue !== undefined) desc += `, default: ${rt.defaultValue}`;
        if (rt.options && rt.options.length > 0) desc += `, options: ${rt.options.join('|')}`;
        desc += ')';
        return desc;
      }).join('\n')
    : 'No resource templates defined.';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASS 1 — WRITE the chapter (no tools, pure prose)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const writePrompt = `
Write the next chapter in ${language}.

=== STORY CONTEXT ===
Outline: ${contextOutput.outline}

Scene: ${contextOutput.currentScene}

Active Characters: ${existingCharacterNames.join(', ') || 'None specified'}

Relevant Plot Points:
${contextOutput.relevantPlotPoints.map((p) => `- ${p}`).join('\n') || '- None'}

Filtered Context:
${contextOutput.filteredContext}

=== EXISTING CHARACTERS ===
${existingCharactersBlock}

=== EXISTING ITEMS (USE EXACT rarity in [[item:Name:rarity]] markup) ===
${existingItemsBlock}

=== EXISTING SPECIAL ITEMS (USE EXACT rarity in [[special:Name:rarity]] markup) ===
${existingSpecialItemsBlock}

Write the complete chapter now. Use [[char:Name]], [[item:Name:rarity]], [[special:Name:rarity]] markup for all entities.`.trim();

  let chapterContent: string;
  const { Chapter } = await import('../models/Chapter');

  if (skipPass1) {
    // Pass 1 skipped — read existing content from DB
    const existing = await Chapter.findById(chapterId).lean();
    if (!existing || !existing.content) {
      throw new Error('Cannot skip Pass 1: chapter has no content');
    }
    chapterContent = existing.content;
    console.log(`[Writer] Pass 1 SKIPPED — using existing content (${chapterContent.length} chars)`);
  } else {
    console.log(`[Writer] Pass 1 — Writing chapter content for chapter=${chapterId}`);

    const writeStream = streamText({
      model,
      system: `${WRITER_SYSTEM_PROMPT}\nWrite in ${language}.`,
      prompt: writePrompt,
    });

    chapterContent = await writeStream.text;

    // Save content immediately so the user can start reading
    await Chapter.findByIdAndUpdate(chapterId, {
      content: chapterContent,
      status: 'completed',
      toolsStatus: 'pending',
    });

    console.log(`[Writer] Pass 1 complete — ${chapterContent.length} chars written, saved to DB`);
  }
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASS 2 — TOOLS: Analyze chapter, update game state, generate choices
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const tools = {
    createCharacter: makeCreateCharacterTool(playthroughId, worldId, userId),
    createItem: makeCreateItemTool(playthroughId, userId),
    createSpecialItem: makeCreateSpecialItemTool(playthroughId, userId),
    updateStats: makeUpdateStatsTool(playthroughId, userId),
    updateEntityStatus: makeUpdateEntityStatusTool(playthroughId),
    summarizeArc: makeSummarizeArcTool(),
    generateChoices: makeGenerateChoicesTool(chapterId),
  };

  const toolsPrompt = `
Analyze the following chapter and call ALL necessary tools to update the game state.
Language: ${language}. ALL tool arguments must be in ${language}.

=== CHAPTER CONTENT ===
${chapterContent}

=== EXISTING CHARACTERS (DO NOT recreate these — they already exist) ===
${existingCharactersBlock}

=== EXISTING ITEMS (DO NOT recreate these) ===
${existingItemsBlock}

=== EXISTING SPECIAL ITEMS (DO NOT recreate these) ===
${existingSpecialItemsBlock}

=== AVAILABLE SPECIAL ITEM CATEGORIES (MUST use one when calling createSpecialItem) ===
${templateCategoriesBlock}

=== RESOURCE TEMPLATES / CHARACTER STATS (MUST provide dynamicStats when calling createCharacter) ===
${resourceTemplatesBlock}

=== INSTRUCTIONS ===
Based on the chapter above:
1. Create any NEW characters that appeared (not in EXISTING CHARACTERS). Provide dynamicStats with values meaningful to their role.
2. Create any NEW items that appeared (not in EXISTING ITEMS).
3. Create any NEW special items/abilities (not in EXISTING SPECIAL ITEMS). Category MUST match AVAILABLE SPECIAL ITEM CATEGORIES.
4. Update stats for characters whose attributes changed. Reference their CURRENT values above and calculate new values based on events.
5. Update entity statuses for any deaths, injuries, destructions, etc.
6. Call summarizeArc ONLY if a major story arc concluded.
7. MUST call generateChoices with 3-4 meaningful choices for the reader.

Call all applicable tools NOW. Do NOT output any text — ONLY tool calls.`.trim();

  // Mark tools as running
  await Chapter.findByIdAndUpdate(chapterId, { toolsStatus: 'running' });
  console.log(`[Writer] Pass 2 — Running tool calls for chapter=${chapterId}`);

  const toolStream = streamText({
    model,
    system: TOOLS_SYSTEM_PROMPT,
    prompt: toolsPrompt,
    tools,
    stopWhen: stepCountIs(maxSteps),
  });

  // Wait for all tool calls to complete
  await toolStream.steps;

  // Mark tools as completed
  await Chapter.findByIdAndUpdate(chapterId, { toolsStatus: 'completed' });

  console.log(`[Writer] Pass 2 complete — all tool calls executed for chapter=${chapterId}`);
  return { text: chapterContent };
}
