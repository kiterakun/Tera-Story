import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';
import { Chapter } from '../models/Chapter';
import { Arc } from '../models/Arc';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';
import { SpecialItemTemplate } from '../models/SpecialItemTemplate';
import type { IContextOutput } from '../types/agent.types';

export interface ContextAgentParams {
  playthroughId: string;
  currentArcId?: string;
  playerChoice: string;
  userId: string;
  model: LanguageModel;
  language: string;
}

export type ContextOutput = IContextOutput;

const SYSTEM_PROMPT = `You are a story intelligence analyst for an interactive novel. Analyze the current story state and produce a focused context for the next chapter writer. Respond ONLY with valid JSON — no markdown fences, no explanation.

Output JSON schema:
{
  "outline": "string",
  "filteredContext": "string",
  "activeCharacters": ["string"],
  "currentScene": "string",
  "relevantPlotPoints": ["string"]
}`;

/**
 * Robustly extract JSON from LLM text response.
 * Handles: markdown fences, leading/trailing text, raw JSON.
 */
function extractJson(text: string): unknown {
  // Strategy 1: Try to find JSON inside markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
  }

  // Strategy 2: Find first { ... last } in the text
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch { /* fall through */ }
  }

  // Strategy 3: Try parsing the whole text as-is
  try { return JSON.parse(text.trim()); } catch { /* fall through */ }

  throw new Error(`Failed to extract JSON from context agent response: ${text.slice(0, 200)}...`);
}

export async function runContextAgent(
  params: ContextAgentParams
): Promise<ContextOutput> {
  const { playthroughId, currentArcId, playerChoice, model, language } = params;

  // 1. Fetch playthrough → world
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) throw new Error('Playthrough not found');

  const world = await World.findById(playthrough.worldId).lean();
  if (!world) throw new Error('World not found');

  // 2. Fetch all characters, items, and special items in parallel
  const [characters, items, specialItems, specialItemTemplates] = await Promise.all([
    Character.find({ playthroughId }).lean(),
    Item.find({ playthroughId }).lean(),
    SpecialItem.find({ playthroughId }).lean(),
    SpecialItemTemplate.find({ worldId: playthrough.worldId }).lean(),
  ]);

  // 3. Fetch recent chapters from current arc (limit 5 most recent)
  let recentChapters: Array<{ content: string; chapterIndex: number }> = [];
  if (currentArcId) {
    recentChapters = await Chapter.find({ arcId: currentArcId })
      .sort({ chapterIndex: -1 })
      .limit(5)
      .select('content chapterIndex')
      .lean();
    // Reverse so they're in chronological order
    recentChapters.reverse();
  }

  // 4. Fetch previous arcs (summary only)
  const previousArcs = await Arc.find({
    playthroughId,
    status: 'completed',
  })
    .sort({ arcIndex: 1 })
    .select('title summary arcIndex')
    .lean();

  // 5. Build user prompt with ALL world data
  const isColdStart = recentChapters.length === 0;

  // World info including resource templates AND special item templates
  const worldInfo = [
    `World: ${world.name}`,
    `Genre: ${world.genre}`,
    `Description: ${world.description}`,
    world.resourceTemplates.length > 0
      ? `Resource Templates: ${world.resourceTemplates.map((t) => `${t.key} (${t.type})`).join(', ')}`
      : '',
    specialItemTemplates.length > 0
      ? `Special Item Categories: ${specialItemTemplates.map((t) => `${t.category} — ${t.description}`).join('; ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  // Character info with all dynamic stats + status
  const characterInfo = characters
    .map((c) => {
      const stats = c.dynamicStats
        .map((s) => `${s.k}=${s.v}`)
        .join(', ');
      const statusTag = (c as any).status && (c as any).status !== 'active' ? ` [STATUS: ${(c as any).status.toUpperCase()}]` : '';
      return `- ${c.name} (${c.role}${statusTag}): ${c.description}${stats ? ` [${stats}]` : ''}`;
    })
    .join('\n');

  // Items info with status
  const itemsInfo =
    items.length > 0
      ? items
          .map((i) => {
            const ownerChar = i.ownerId
              ? characters.find((c) => c._id.toString() === i.ownerId?.toString())
              : null;
            const statusTag = (i as any).status && (i as any).status !== 'active' ? ` [STATUS: ${(i as any).status.toUpperCase()}]` : '';
            return `- ${i.name} (${i.rarity ?? 'common'}${statusTag}): ${i.description}${ownerChar ? ` [owned by ${ownerChar.name}]` : ''}`;
          })
          .join('\n')
      : 'No items yet.';

  // Special items info with status
  const specialItemsInfo =
    specialItems.length > 0
      ? specialItems
          .map((si) => {
            const ownerChar = si.ownerId
              ? characters.find((c) => c._id.toString() === si.ownerId?.toString())
              : null;
            const statusTag = (si as any).status && (si as any).status !== 'active' ? ` [STATUS: ${(si as any).status.toUpperCase()}]` : '';
            return `- ${si.name} [${si.category}] (${si.rarity}${statusTag}): ${si.description}${ownerChar ? ` [owned by ${ownerChar.name}]` : ''}`;
          })
          .join('\n')
      : 'No special items yet.';

  const arcSummaries =
    previousArcs.length > 0
      ? previousArcs
          .map(
            (a) =>
              `Arc ${a.arcIndex}: "${a.title}" — ${a.summary || 'No summary'}`
          )
          .join('\n')
      : 'No previous arcs.';

  const chapterTexts =
    recentChapters.length > 0
      ? recentChapters
          .map((ch) => `[Chapter ${ch.chapterIndex}]\n${ch.content}`)
          .join('\n---\n')
      : 'No chapters yet (beginning of story).';

  const userPrompt = `
Language: ${language}
Player's choice: "${playerChoice}"

=== WORLD ===
${worldInfo}

=== CHARACTERS ===
${characterInfo || 'No characters yet.'}

=== ITEMS (INVENTORY) ===
${itemsInfo}

=== SPECIAL ITEMS (SKILLS / TECHNIQUES / ETC.) ===
${specialItemsInfo}

=== PREVIOUS ARC SUMMARIES ===
${arcSummaries}

=== RECENT CHAPTERS ===
${isColdStart ? 'This is the very beginning of the story. No chapters have been written yet.' : chapterTexts}

Based on the player's choice and the FULL story state above (including all items, special items, character stats, and world templates), produce the JSON context for the next chapter writer.
`.trim();

  // 6. Call generateText then parse JSON robustly
  //    generateObject requires provider tool-calling support which custom/proxy endpoints often lack.
  //    Instead we use generateText and extract JSON from the response.
  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.3,
  });

  // Robust JSON extraction: handle markdown fences, leading text, etc.
  const parsed = extractJson(text);

  // Validate with Zod for safety
  const contextOutputSchema = z.object({
    outline: z.string(),
    filteredContext: z.string(),
    activeCharacters: z.array(z.string()),
    currentScene: z.string(),
    relevantPlotPoints: z.array(z.string()),
  });

  const validated = contextOutputSchema.parse(parsed);

  // Build structured entity refs directly from DB (authoritative, not LLM-summarized)
  const existingItems = items.map((i) => {
    const ownerChar = i.ownerId
      ? characters.find((c) => c._id.toString() === i.ownerId?.toString())
      : null;
    return {
      name: i.name,
      rarity: i.rarity ?? 'common',
      status: (i as any).status ?? 'active',
      owner: ownerChar?.name,
    };
  });

  const existingSpecialItems = specialItems.map((si) => {
    const ownerChar = si.ownerId
      ? characters.find((c) => c._id.toString() === si.ownerId?.toString())
      : null;
    return {
      name: si.name,
      rarity: si.rarity ?? 'common',
      status: (si as any).status ?? 'active',
      category: si.category,
      owner: ownerChar?.name,
    };
  });

  return {
    outline: validated.outline ?? '',
    filteredContext: validated.filteredContext ?? '',
    activeCharacters: validated.activeCharacters ?? [],
    existingItems,
    existingSpecialItems,
    specialItemTemplateCategories: specialItemTemplates.map((t) => ({
      category: t.category,
      description: t.description,
    })),
    currentScene: validated.currentScene ?? '',
    relevantPlotPoints: validated.relevantPlotPoints ?? [],
  };
}
