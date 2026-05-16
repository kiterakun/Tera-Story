import { streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { extractJson } from '../utils/jsonExtractor';
import { renderPrompt } from './prompts/renderPrompt';
import { IResourceTemplate } from '../types/world.types';
import { IDynamicStat } from '../types/character.types';

interface EnrichWorldResult {
  name: string;
  description: string;
  genre: string;
  resourceTemplates: IResourceTemplate[];
  locationResourceTemplates?: IResourceTemplate[];
  specialItemTemplates?: Array<{
    category: string;
    description: string;
    fields: Array<{ name: string; type: 'text' | 'number' | 'enum'; options?: string[] }>;
  }>;
}

interface EnrichCharacterResult {
  characterName: string;
  characterDescription: string;
  suggestedStats: IDynamicStat[];
  background?: string;
  personality?: string;
  goals?: string;
  appearance?: string;
}

export async function enrichWorld(
  description: string,
  model: LanguageModel,
  language: string
): Promise<EnrichWorldResult> {
  const result = streamText({
    model,
    system: renderPrompt('support-world.prompt.md', { language }),
    prompt: description,
    temperature: 0.7,
  });

  const text = await result.text;
  return extractJson<EnrichWorldResult>(text);
}

export async function enrichCharacter(
  description: string,
  worldContext: string,
  model: LanguageModel,
  language: string
): Promise<EnrichCharacterResult> {
  const result = streamText({
    model,
    system: renderPrompt('support-character.prompt.md', { language }),
    prompt: worldContext
      ? `Character idea: ${description}\n\n=== WORLD CONTEXT (character MUST fit this world) ===\n${worldContext}`
      : `Character idea: ${description}`,
    temperature: 0.7,
  });

  const text = await result.text;
  return extractJson<EnrichCharacterResult>(text);
}

export async function enrichChoices(
  context: string,
  model: LanguageModel,
  language: string
): Promise<string[]> {
  const result = streamText({
    model,
    system: `You are a story continuation expert. Given the current story context, suggest 3 engaging choices for the reader. Respond ONLY with a valid JSON array of strings, e.g. ["choice 1", "choice 2", "choice 3"]. Language: ${language}`,
    prompt: context,
    temperature: 0.7,
  });

  const text = await result.text;
  return extractJson<string[]>(text);
}

export interface EnrichCustomChoiceResult {
  enrichedChoice: string;
  warnings: string[];
  isValid: boolean;
  suggestions: string[];
}

export async function enrichCustomChoice(
  customChoice: string,
  storyContext: string,
  worldContext: string,
  model: LanguageModel,
  language: string
): Promise<EnrichCustomChoiceResult> {
  const result = streamText({
    model,
    system: `You are a story consistency expert and creative writing advisor. The user has written a custom choice for their interactive story. Your job is to:
1. Evaluate if this choice is logically consistent with the story so far and world rules.
2. If it breaks story logic, world rules, or character consistency, set isValid=false and explain WHY in warnings[].
3. Provide an enriched/improved version of the choice that fits better narratively.
4. Suggest 2-3 alternative choices the user might consider.

Respond ONLY with valid JSON matching this schema:
{
  "enrichedChoice": "string (improved version of user's choice)",
  "warnings": ["string (each warning about why the choice might break story logic)"],
  "isValid": true/false,
  "suggestions": ["string (alternative choice 1)", "string (alternative choice 2)"]
}

World context: ${worldContext}
Language: ${language}`,
    prompt: `User's custom choice: "${customChoice}"\n\nRecent story context:\n${storyContext}`,
    temperature: 0.7,
  });

  const text = await result.text;
  return extractJson<EnrichCustomChoiceResult>(text);
}

export interface GenerateWhispersResult {
  whispers: Array<{
    type: 'rumor' | 'letter' | 'diary' | 'news';
    content: string;
    relatedEntityType?: 'character' | 'location' | 'item' | 'arc';
    relatedEntityId?: string;
    attribution?: string;
  }>;
}

/**
 * Generate whispers for a playthrough when user returns after extended absence.
 * Called by the whispers API route after verifying the user was away > 24h.
 */
export async function generateWhispers(
  playthroughContext: string,
  daysAway: number,
  model: LanguageModel,
  language: string
): Promise<GenerateWhispersResult> {
  const result = streamText({
    model,
    system: `You are a world storyteller for an interactive RPG novel. The player has been away for ${daysAway} day(s). Generate 3-5 short "whispers" — world news, rumors, letters, or diary entries about what happened in the world during their absence.

Whisper types:
- rumor: Hearsay from villagers or travelers (curious, mysterious tone)
- letter: A message from a known NPC (personal, urgent tone)
- diary: A diary entry from someone affected by events (reflective, nostalgic tone)
- news: A public announcement or news bulletin (informative, impactful tone)

Rules:
- Whispers MUST be consistent with the existing story context
- Each whisper should feel like the world continued without the player
- Include subtle hooks that make the player curious about what they missed
- Do NOT resolve major plot points — only hint at developments

Respond ONLY with valid JSON matching this schema:
{
  "whispers": [
    {
      "type": "rumor",
      "content": "string (50-500 characters, vivid and engaging)",
      "relatedEntityType": "character"|"location"|"item"|"arc",
      "relatedEntityId": "string (if mentioned in context)",
      "attribution": "string (NPC name or source, for rumor/letter types)"
    }
  ]
}

Language: ${language}`,
    prompt: playthroughContext,
    temperature: 0.9,
  });

  const text = await result.text;
  return extractJson<GenerateWhispersResult>(text);
}
