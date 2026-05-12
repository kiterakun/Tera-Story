import { streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';
import { extractJson } from '../utils/jsonExtractor';
import { renderPrompt } from './prompts/renderPrompt';
import { Chapter } from '../models/Chapter';
import { Arc } from '../models/Arc';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';
import { SpecialItemTemplate } from '../models/SpecialItemTemplate';
import { Relationship } from '../models/Relationship';
import { ConsequenceSeed } from '../models/ConsequenceSeed';
import { CombatEncounter } from '../models/CombatEncounter';
import type { IContextOutput } from '../types/agent.types';
import { Continent } from '../models/Continent';
import { Region } from '../models/Region';
import { Location } from '../models/Location';

export interface ContextAgentParams {
  playthroughId: string;
  currentArcId?: string;
  playerChoice: string;
  userId: string;
  model: LanguageModel;
  language: string;
}

export type ContextOutput = IContextOutput;

const SYSTEM_PROMPT = renderPrompt('context.prompt.md');

export async function runContextAgent(
  params: ContextAgentParams
): Promise<ContextOutput & { geography?: Record<string, unknown> }> {
  const { playthroughId, currentArcId, playerChoice, model, language } = params;

  // 1. Fetch playthrough → world
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) throw new Error('Playthrough not found');

  const world = await World.findById(playthrough.worldId).lean();
  if (!world) throw new Error('World not found');

  // 2. Fetch all characters, items, special items, relationships, consequences, combat, continents in parallel
  const [characters, items, specialItems, specialItemTemplates, relationships, allConsequences, activeCombatDoc, continents] = await Promise.all([
    Character.find({ playthroughId }).lean(),
    Item.find({ playthroughId }).lean(),
    SpecialItem.find({ playthroughId }).lean(),
    SpecialItemTemplate.find({ worldId: playthrough.worldId }).lean(),
    Relationship.find({ playthroughId }).lean(),
    ConsequenceSeed.find({ playthroughId, activated: false }).lean(),
    CombatEncounter.findOne({ playthroughId, status: 'active' }).lean(),
    Continent.find({ worldId: playthrough.worldId }).lean(),
  ]);

  // 2b. Build geography data from first continent
  const firstContinent = continents[0];
  let geography: {
    currentContinent: any;
    regions: any[];
    currentRegion: any;
    nearbyLocations: any[];
  } | undefined;
  if (firstContinent) {
    const continentRegions = await Region.find({ continentId: firstContinent._id }).lean();
    const firstRegion = continentRegions[0];
    let nearbyLocations: any[] = [];
    if (firstRegion) {
      nearbyLocations = await Location.find({
        regionId: firstRegion._id,
        playthroughId,
        status: { $in: ['known', 'visited'] }
      }).lean();
    }
    geography = {
      currentContinent: firstContinent,
      regions: continentRegions,
      currentRegion: firstRegion || null,
      nearbyLocations,
    };
  }

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
      const statusTag = (c as { status?: string }).status && (c as { status?: string }).status !== 'active' ? ` [STATUS: ${(c as { status?: string }).status!.toUpperCase()}]` : '';
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
            const statusTag = (i as { status?: string }).status && (i as { status?: string }).status !== 'active' ? ` [STATUS: ${(i as { status?: string }).status!.toUpperCase()}]` : '';
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
            const statusTag = (si as { status?: string }).status && (si as { status?: string }).status !== 'active' ? ` [STATUS: ${(si as { status?: string }).status!.toUpperCase()}]` : '';
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

  // --- Relationship info ---
  const relationshipInfo = relationships.length > 0
    ? relationships.map((r) => {
        const charA = characters.find((c) => c._id.toString() === r.characterA.toString());
        const charB = characters.find((c) => c._id.toString() === r.characterB.toString());
        return `- ${charA?.name || '?'} ↔ ${charB?.name || '?'}: ${r.type} (intensity: ${r.intensity})`;
      }).join('\n')
    : 'No established relationships yet.';

  // --- Mature consequence seeds ---
  const chapterCount = await Chapter.countDocuments({ playthroughId });
  const matureSeeds = allConsequences.filter(
    (s) => chapterCount >= s.triggerChapterIndex + s.minChapterDelay
  );
  const consequencesInfo = matureSeeds.length > 0
    ? matureSeeds.map((s) => `- [${s.impact.toUpperCase()}] ${s.description} (planted in chapter ${s.triggerChapterIndex + 1}, tags: ${s.tags.join(', ')})`).join('\n')
    : 'No mature consequences.';

  // --- Active combat ---
  const combatInfo = activeCombatDoc
    ? `ACTIVE COMBAT: ${activeCombatDoc.context}\nCombatants: ${activeCombatDoc.combatants.map((c) => `${c.name} (${c.side}) HP:${c.currentHp}/${c.maxHp}`).join(', ')}\nRounds played: ${activeCombatDoc.rounds.length}`
    : '';

  let geographyInfo = '';
  if (geography) {
    geographyInfo = [
      '=== GEOGRAPHY ===',
      `Current Continent: ${geography.currentContinent.name} \u2014 ${geography.currentContinent.description} (${geography.currentContinent.terrainType})`,
      geography.currentRegion ? `Current Region: ${geography.currentRegion.name} \u2014 ${geography.currentRegion.description} (danger level: ${geography.currentRegion.dangerLevel})` : null,
      geography.nearbyLocations.length > 0 ? `Nearby Locations: ${geography.nearbyLocations.map((l: any) => `${l.name} (${l.type})`).join(', ')}` : null,
    ].filter(Boolean).join('\n');
  }

  const userPrompt = `
Language: ${language}
Player's choice: "${playerChoice}"

=== WORLD ===
${worldInfo}

=== CHARACTERS ===
${characterInfo || 'No characters yet.'}

=== RELATIONSHIPS ===
${relationshipInfo}

=== ITEMS (INVENTORY) ===
${itemsInfo}

=== SPECIAL ITEMS (SKILLS / TECHNIQUES / ETC.) ===
${specialItemsInfo}

=== MATURE CONSEQUENCES (Butterfly Effect — incorporate these into the story when appropriate) ===
${consequencesInfo}

${combatInfo ? `=== ACTIVE COMBAT ===\n${combatInfo}\n` : ''}${geographyInfo ? `${geographyInfo}\n` : ''}=== PREVIOUS ARC SUMMARIES ===
${arcSummaries}

=== RECENT CHAPTERS ===
${isColdStart ? 'This is the very beginning of the story. No chapters have been written yet.' : chapterTexts}

Based on the player's choice and the FULL story state above (including all items, special items, character stats, relationships, consequences, and world templates), produce the JSON context for the next chapter writer.
`.trim();

  // 6. Call generateText then parse JSON robustly
  // We use streamText and robust JSON extraction because some providers/models
  // (like reasoning models) ignore stream:false or force SSE streams.
  // Using streamText lets the SDK properly parse chunks, then we await the full text.
  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.3,
  });

  const text = await result.text;
  const usage = await result.usage;

  // Robust JSON extraction: handles <think> blocks, markdown fences, leading text
  const parsed = extractJson(text);

  // Validate with Zod for safety
  const contextOutputSchema = z.object({
    outline: z.string(),
    filteredContext: z.string(),
    activeCharacters: z.array(z.string()),
    currentScene: z.string(),
    relevantPlotPoints: z.array(z.string()),
    geography: z.object({
      currentContinent: z.object({
        name: z.string(),
        description: z.string(),
        terrainType: z.string(),
      }).optional(),
      currentRegion: z.object({
        name: z.string(),
        description: z.string(),
        terrainType: z.string(),
        dangerLevel: z.number(),
      }).optional().nullable(),
      nearbyLocations: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
      })).optional(),
    }).optional(),
  });

  const validated = contextOutputSchema.parse(parsed);


  // Build full character refs from DB — authoritative source of truth
  // Include ALL DB characters (not just LLM-mentioned ones) to prevent missed entities
  const activeCharacterRefs = characters.map((c) => ({
    name: c.name,
    role: c.role as 'protagonist' | 'npc',
    status: (c as { status?: string }).status ?? 'active',
    description: c.description,
    dynamicStats: Object.fromEntries(c.dynamicStats.map((s) => [s.k, s.v])),
  }));

  // Build structured entity refs directly from DB (authoritative, not LLM-summarized)
  const existingItems = items.map((i) => {
    const ownerChar = i.ownerId
      ? characters.find((c) => c._id.toString() === i.ownerId?.toString())
      : null;
    return {
      name: i.name,
      rarity: i.rarity ?? 'common',
      status: (i as { status?: string }).status ?? 'active',
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
      status: (si as { status?: string }).status ?? 'active',
      category: si.category,
      owner: ownerChar?.name,
    };
  });

  // Build relationship refs
  const relationshipRefs = relationships.map((r) => {
    const charA = characters.find((c) => c._id.toString() === r.characterA.toString());
    const charB = characters.find((c) => c._id.toString() === r.characterB.toString());
    return {
      characterA: charA?.name || 'Unknown',
      characterB: charB?.name || 'Unknown',
      type: r.type,
      intensity: r.intensity,
    };
  });

  // Build mature consequence refs
  const consequenceRefs = matureSeeds.map((s) => ({
    description: s.description,
    impact: s.impact,
    tags: s.tags,
    triggerChapterIndex: s.triggerChapterIndex,
  }));

  // Build active combat ref
  const activeCombat = activeCombatDoc
    ? {
        combatId: activeCombatDoc._id.toString(),
        context: activeCombatDoc.context,
        status: activeCombatDoc.status,
        combatants: activeCombatDoc.combatants.map((c) => ({
          name: c.name,
          side: c.side,
          currentHp: c.currentHp,
          maxHp: c.maxHp,
          defeated: c.defeated,
        })),
        availableActions: activeCombatDoc.availableActions,
        roundCount: activeCombatDoc.rounds.length,
      }
    : null;

  return {
    outline: validated.outline ?? '',
    filteredContext: validated.filteredContext ?? '',
    activeCharacters: activeCharacterRefs,
    existingItems,
    existingSpecialItems,
    specialItemTemplateCategories: specialItemTemplates.map((t) => ({
      category: t.category,
      description: t.description,
      fields: (t.fields || []).map((f) => ({
        name: f.name,
        type: f.type,
        ...(f.options && f.options.length > 0 ? { options: f.options } : {}),
        ...(f.required ? { required: f.required } : {}),
      })),
    })),
    resourceTemplates: (world.resourceTemplates || []).map((t) => ({
      key: t.key,
      type: t.type,
      ...(t.min !== undefined ? { min: t.min } : {}),
      ...(t.max !== undefined ? { max: t.max } : {}),
      ...(t.defaultValue !== undefined ? { defaultValue: t.defaultValue } : {}),
      ...(t.options && t.options.length > 0 ? { options: t.options } : {}),
    })),
    relationships: relationshipRefs,
    matureConsequences: consequenceRefs,
    activeCombat,
    geography,
    currentScene: validated.currentScene ?? '',
    relevantPlotPoints: validated.relevantPlotPoints ?? [],
    usage: usage ? { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 } : undefined,
  };
}