import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { Chapter } from '../models/Chapter';
import { Arc } from '../models/Arc';
import { Character } from '../models/Character';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';
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

const SYSTEM_PROMPT = `You are a story intelligence analyst for an interactive novel. Analyze the current story state and produce a focused context for the next chapter writer. Respond in valid JSON only.

Output JSON schema:
{
  "outline": "string — a brief outline of what should happen next based on the player's choice and story state",
  "filteredContext": "string — the most relevant context the writer needs, distilled from chapters, characters, and world info",
  "activeCharacters": ["string array — names of characters relevant to the next scene"],
  "currentScene": "string — description of the current scene setting",
  "relevantPlotPoints": ["string array — key plot points the writer should be aware of"]
}`;

export async function runContextAgent(
  params: ContextAgentParams
): Promise<ContextOutput> {
  const { playthroughId, currentArcId, playerChoice, model, language } = params;

  // 1. Fetch playthrough → world
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) throw new Error('Playthrough not found');

  const world = await World.findById(playthrough.worldId).lean();
  if (!world) throw new Error('World not found');

  // 2. Fetch all characters in playthrough
  const characters = await Character.find({ playthroughId }).lean();

  const protagonist = characters.find((c) => c.role === 'protagonist');
  const npcs = characters.filter((c) => c.role === 'npc');

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

  // 5. Build user prompt
  const isColdStart = recentChapters.length === 0;

  const worldInfo = [
    `World: ${world.name}`,
    `Genre: ${world.genre}`,
    `Description: ${world.description}`,
    world.resourceTemplates.length > 0
      ? `Resources: ${world.resourceTemplates.map((t) => t.key).join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const characterInfo = characters
    .map((c) => {
      const stats = c.dynamicStats
        .map((s) => `${s.k}=${s.v}`)
        .join(', ');
      return `- ${c.name} (${c.role}): ${c.description}${stats ? ` [${stats}]` : ''}`;
    })
    .join('\n');

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

=== PREVIOUS ARC SUMMARIES ===
${arcSummaries}

=== RECENT CHAPTERS ===
${isColdStart ? 'This is the very beginning of the story. No chapters have been written yet.' : chapterTexts}

Based on the player's choice and the story state above, produce the JSON context for the next chapter writer.
`.trim();

  // 6. Call generateText
  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.3,
  });

  // 7. Parse JSON result
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned) as ContextOutput;

  return {
    outline: parsed.outline ?? '',
    filteredContext: parsed.filteredContext ?? '',
    activeCharacters: parsed.activeCharacters ?? [],
    currentScene: parsed.currentScene ?? '',
    relevantPlotPoints: parsed.relevantPlotPoints ?? [],
  };
}
