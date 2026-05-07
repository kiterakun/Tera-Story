import { streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { extractJson } from '../utils/jsonExtractor';
import { IResourceTemplate } from '../types/world.types';
import { IDynamicStat } from '../types/character.types';

interface EnrichWorldResult {
  name: string;
  description: string;
  genre: string;
  resourceTemplates: IResourceTemplate[];
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
}

export async function enrichWorld(
  description: string,
  model: LanguageModel,
  language: string
): Promise<EnrichWorldResult> {
  const result = streamText({
    model,
    system: `You are a world-building assistant for an interactive novel RPG. Given a user's idea or description, create a COMPLETE and DETAILED world with name, genre, rich description, resource templates (RPG stats like HP, MP, Gold, Experience, etc.), and special item templates (categories of special abilities/skills/techniques the AI story writer can create during gameplay).

Respond ONLY with valid JSON matching this schema:
{
  "name": "string",
  "description": "string (rich, evocative, 2-4 paragraphs describing the world's lore, atmosphere, and key features)",
  "genre": "fantasy|sci-fi|wuxia|modern|custom",
  "resourceTemplates": [
    { "key": "string", "type": "number|text|progress|enum", "min": 0, "max": 100, "defaultValue": 0, "options": ["string (if type is enum)"] }
  ],
  "specialItemTemplates": [
    {
      "category": "string (e.g. Skill, Technique, Spell, Mutation)",
      "description": "string (what this category represents in the world)",
      "fields": [
        { "name": "string (e.g. Element, Cooldown, Damage)", "type": "text|number|enum", "options": ["string (if type is enum)"] }
      ]
    }
  ]
}

Guidelines:
- Create 4-8 meaningful resource templates appropriate for the genre
- Create 2-4 special item template categories that fit the world's theme
- Each special item category should have 2-4 custom fields
- Use the user's language for all content
Language: ${language}`,
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
    system: `You are an expert character creator for an interactive novel RPG. Given a user's description/idea and the FULL world context, create a character that FITS PERFECTLY into this world.

CRITICAL RULES:
- The character MUST be consistent with the world's genre, lore, atmosphere, and setting
- The character's stats (suggestedStats) MUST use the EXACT same keys as the world's resource templates — do NOT invent new stat keys
- The description should reference elements from the world (locations, factions, magic systems, technology, etc.)
- If the world has special item categories (skills, techniques, etc.), consider mentioning relevant abilities the character might have or aspire to
- Make the character feel like a natural inhabitant of this specific world, not a generic RPG character

Respond ONLY with valid JSON matching this schema:
{
  "characterName": "string (a name that fits the world's culture and genre)",
  "characterDescription": "string (2-3 paragraphs: appearance, personality, backstory rooted in the world's lore)",
  "suggestedStats": [
    { "k": "string (MUST match a resource template key from the world)", "v": "string|number (appropriate starting value)", "t": "string (type matching the template: number|text|progress|enum)" }
  ]
}
Language: ${language}`,
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
