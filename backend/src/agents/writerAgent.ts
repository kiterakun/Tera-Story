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
import { makeUpdateRelationshipTool } from '../tools/updateRelationship';
import { makePlantConsequenceTool, makeActivateConsequenceTool } from '../tools/plantConsequence';
import { makeInitiateCombatTool } from '../tools/initiateCombat';

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
  /** Optional callback for each text token during Pass 1 streaming */
  onToken?: (token: string) => void;
  /** Called when Pass 2 (tools) starts */
  onToolsStart?: () => void;
  /** Called when Pass 2 (tools) completes */
  onToolsComplete?: () => void;
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

RELATIONSHIP AWARENESS:
- Use character relationships to drive natural drama, tension, and emotional depth
- Allies should act supportive, rivals should create tension, enemies should be hostile
- Relationship changes (betrayal, bonding, romance development) make great story moments

CONSEQUENCE AWARENESS:
- If MATURE CONSEQUENCES are listed, try to naturally weave them into the chapter when appropriate
- These are delayed effects from earlier player choices — make the callback feel earned and surprising
- Not every consequence needs to activate in every chapter — only when it fits naturally

COMBAT AWARENESS:
- If there is an ACTIVE COMBAT, the chapter should focus on the combat scene
- When combat situations arise naturally, describe the battle scene vividly and set up for combat initiation

ENTITY MARKUP (REQUIRED):
When mentioning SIGNIFICANT characters, items, or special items in the story text, wrap them in special markup. Do NOT markup minor background characters (like "guard", "villager") or trivial, common items.
- Characters: [[char:CharacterName]]
- Items: [[item:ItemName:rarity]]  (rarity = common|uncommon|rare|epic|legendary)
- Special Items: [[special:ItemName:rarity]]
Examples: "[[char:Vương Quân]] drew the [[item:Flame Sword:epic]] and channeled his [[special:Dragon Breath:legendary]] technique."
- Use this markup for EXISTING entities (listed below) and any IMPORTANT NEW entities you introduce in the chapter.
- Use the EXACT rarity listed for existing entities. For new entities, assign appropriate rarity: common (basic), uncommon (notable), rare (powerful), epic (extraordinary), legendary (mythical).
- Do NOT markup generic nouns, background extras, or ordinary objects. Only markup entities that matter to the plot.`;

// ────────────────────────────────────────────────────────────────────────────
// Pass 2 — TOOLS: Read the finished chapter, execute all game-state changes.
// ────────────────────────────────────────────────────────────────────────────

const TOOLS_SYSTEM_PROMPT = `You are a game master analyzing a chapter that was just written for an interactive novel. Your job is to update the game state by calling the appropriate tools based on what happened in the chapter.

Read the chapter content carefully and call ALL necessary tools in a SINGLE step. Do NOT output any prose or story text — ONLY call tools.

TOOL CALLING RULES:

1. createCharacter — ONLY for NEW, SIGNIFICANT characters that will have a recurring role or major impact on the plot. Do NOT create tools for background, minor, or unnamed characters (e.g., generic guards, villagers, random monsters).
   - Provide name, description, role='npc'
   - MUST provide dynamicStats with meaningful values based on the character's role and strength in the story
   - NEVER create characters that already exist in EXISTING CHARACTERS

2. createItem — ONLY for NEW, IMPORTANT items that are crucial to the plot or have significant value/power. Do NOT create tools for generic or common objects (e.g., normal clothes, common food, generic swords).
   - Provide name, description, rarity matching the [[item:Name:rarity]] markup used in the chapter

3. createSpecialItem — ONLY for NEW, NOTABLE special abilities/skills/spells that are powerful or unique. Do NOT create tools for basic or trivial skills.
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

6. updateRelationship — For any relationship changes between characters:
   - New alliance formed, betrayal, romantic development, mentor taking a student, rivalry emerging
   - Set appropriate type and intensity (-100 to +100)

7. plantConsequence — For important player decisions that should have DELAYED effects:
   - Sparing an enemy, making promises, acquiring cursed items, offending powerful figures
   - Set appropriate delay (3-10 chapters) and impact level
   - Do NOT plant consequences for trivial events

8. activateConsequence — If any MATURE CONSEQUENCES were woven into this chapter:
   - Mark them as activated so they won't be repeated

9. initiateCombat — If a combat encounter begins in this chapter:
   - Provide enemy combatants with HP based on their strength
   - Provide 3-6 available combat actions for the player
   - Only initiate if the chapter describes the START of a fight

10. summarizeArc — ONLY if a major story arc has clearly concluded in this chapter

11. generateChoices — You MUST call this with 3-4 meaningful choices for the reader UNLESS you are calling initiateCombat or an active combat is continuing. If combat is active or just initiated, DO NOT call generateChoices.

Call ALL applicable tools in a SINGLE step. Do NOT wait for confirmation. If nothing changed (no new entities, no stat changes, no status changes) and there is no active combat, just call generateChoices.

IMPORTANT: Call ALL tools at once in ONE response. Do NOT split across multiple messages. For customFields in createSpecialItem, MUST use a valid JSON object, NOT an XML string.`;

// ────────────────────────────────────────────────────────────────────────────

export async function runWriterAgent(
  params: WriterAgentParams
): Promise<{ 
  text: string;
  usage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
}> {
  const {
    contextOutput,
    playthroughId,
    arcId,
    chapterId,
    worldId,
    userId,
    model,
    language,
    maxSteps = 2,
    skipPass1 = false,
    onToken,
    onToolsStart,
    onToolsComplete,
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

  // --- Relationship context ---
  const relationshipsBlock = contextOutput.relationships.length > 0
    ? contextOutput.relationships.map(r => `- ${r.characterA} ↔ ${r.characterB}: ${r.type} (intensity: ${r.intensity})`).join('\n')
    : 'No established relationships.';

  // --- Mature consequences ---
  const consequencesBlock = contextOutput.matureConsequences.length > 0
    ? contextOutput.matureConsequences.map(c => `- [${c.impact.toUpperCase()}] ${c.description} (planted ch.${c.triggerChapterIndex + 1}, tags: ${c.tags.join(', ')})`).join('\n')
    : 'No mature consequences.';

  // --- Active combat ---
  const combatBlock = contextOutput.activeCombat
    ? `ACTIVE COMBAT: ${contextOutput.activeCombat.context}\nCombatants: ${contextOutput.activeCombat.combatants.map(c => `${c.name}(${c.side}) HP:${c.currentHp}/${c.maxHp}`).join(', ')}`
    : '';

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

=== CHARACTER RELATIONSHIPS ===
${relationshipsBlock}

=== EXISTING ITEMS (USE EXACT rarity in [[item:Name:rarity]] markup) ===
${existingItemsBlock}

=== EXISTING SPECIAL ITEMS (USE EXACT rarity in [[special:Name:rarity]] markup) ===
${existingSpecialItemsBlock}

=== MATURE CONSEQUENCES (Butterfly Effect — weave these in when it fits naturally) ===
${consequencesBlock}

${combatBlock ? `=== ACTIVE COMBAT ===\n${combatBlock}\n` : ''}
Write the complete chapter now. Use [[char:Name]], [[item:Name:rarity]], [[special:Name:rarity]] markup for all entities.`.trim();

  let chapterContent: string;
  let pass1Usage: any = null;
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

    // If onToken callback exists, iterate token stream for SSE
    if (onToken) {
      const chunks: string[] = [];
      for await (const chunk of writeStream.textStream) {
        chunks.push(chunk);
        onToken(chunk);
      }
      chapterContent = chunks.join('');
    } else {
      chapterContent = await writeStream.text;
    }

    pass1Usage = await writeStream.usage;

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
    createCharacter: makeCreateCharacterTool(playthroughId, worldId, userId, chapterId),
    createItem: makeCreateItemTool(playthroughId, worldId, userId, chapterId),
    createSpecialItem: makeCreateSpecialItemTool(playthroughId, worldId, userId, chapterId),
    updateStats: makeUpdateStatsTool(playthroughId, userId),
    updateEntityStatus: makeUpdateEntityStatusTool(playthroughId),
    updateRelationship: makeUpdateRelationshipTool(playthroughId),
    plantConsequence: makePlantConsequenceTool(playthroughId, chapterId),
    activateConsequence: makeActivateConsequenceTool(playthroughId, chapterId),
    initiateCombat: makeInitiateCombatTool(playthroughId, chapterId),
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

=== CHARACTER RELATIONSHIPS (current state — update if changed) ===
${relationshipsBlock}

=== EXISTING ITEMS (DO NOT recreate these) ===
${existingItemsBlock}

=== EXISTING SPECIAL ITEMS (DO NOT recreate these) ===
${existingSpecialItemsBlock}

=== AVAILABLE SPECIAL ITEM CATEGORIES (MUST use one when calling createSpecialItem) ===
${templateCategoriesBlock}

=== RESOURCE TEMPLATES / CHARACTER STATS (MUST provide dynamicStats when calling createCharacter) ===
${resourceTemplatesBlock}

=== MATURE CONSEQUENCES (mark as activated if woven into this chapter) ===
${consequencesBlock}

=== INSTRUCTIONS ===
Based on the chapter above:
1. Create any NEW characters that appeared (not in EXISTING CHARACTERS). Provide dynamicStats with values meaningful to their role. If a stat has options, you MUST choose exactly one of those options.
2. Create any NEW items that appeared (not in EXISTING ITEMS).
3. Create any NEW special items/abilities (not in EXISTING SPECIAL ITEMS). Category MUST match AVAILABLE SPECIAL ITEM CATEGORIES. If a custom field has options, you MUST choose exactly one of those options.
4. Update stats for characters whose attributes changed. Reference their CURRENT values above and calculate new values based on events.
5. Update entity statuses for any deaths, injuries, destructions, etc.
6. Update relationships if character dynamics changed (new alliance, betrayal, rivalry, romance, etc.).
7. Plant consequence seeds for significant player decisions with delayed effects.
8. Activate any MATURE CONSEQUENCES that were incorporated into this chapter.
9. Initiate combat if a fight scene begins in this chapter.
10. Call summarizeArc ONLY if a major story arc concluded.
11. MUST call generateChoices with 3-4 meaningful choices for the reader.

Call all applicable tools NOW in ONE step. Do NOT output any text — ONLY tool calls.`.trim();

  // Mark tools as running & notify caller
  await Chapter.findByIdAndUpdate(chapterId, { toolsStatus: 'running' });
  onToolsStart?.();
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
  const pass2Usage = await toolStream.usage;

  // Mark tools as completed & notify caller
  await Chapter.findByIdAndUpdate(chapterId, { toolsStatus: 'completed' });
  onToolsComplete?.();

  console.log(`[Writer] Pass 2 complete — all tool calls executed for chapter=${chapterId}`);

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  const p1Usage = pass1Usage as any;
  if (p1Usage) {
    totalPromptTokens += p1Usage.promptTokens || p1Usage.inputTokens || 0;
    totalCompletionTokens += p1Usage.completionTokens || p1Usage.outputTokens || 0;
  }

  const p2Usage = pass2Usage as any;
  if (p2Usage) {
    totalPromptTokens += p2Usage.promptTokens || p2Usage.inputTokens || 0;
    totalCompletionTokens += p2Usage.completionTokens || p2Usage.outputTokens || 0;
  }

  const totalTokens = totalPromptTokens + totalCompletionTokens;

  return {
    text: chapterContent,
    usage: {
      totalTokens,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    },
  };
}
