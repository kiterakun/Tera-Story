import { generateText } from 'ai';
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
    fields: Array<{ name: string; type: 'text' | 'number' | 'enum' }>;
  }>;
}

interface EnrichCharacterResult {
  characterName: string;
  characterDescription: string;
  suggestedStats: IDynamicStat[];
}

export async function enrichWorld(
  description: string,
  model: Parameters<typeof generateText>[0]['model'],
  language: string
): Promise<EnrichWorldResult> {
  const { text } = await generateText({
    model,
    system: `You are a world-building assistant for an interactive novel RPG. Given a user's idea or description, create a COMPLETE and DETAILED world with name, genre, rich description, resource templates (RPG stats like HP, MP, Gold, Experience, etc.), and special item templates (categories of special abilities/skills/techniques the AI story writer can create during gameplay).

Respond ONLY with valid JSON matching this schema:
{
  "name": "string",
  "description": "string (rich, evocative, 2-4 paragraphs describing the world's lore, atmosphere, and key features)",
  "genre": "fantasy|sci-fi|wuxia|modern|custom",
  "resourceTemplates": [
    { "key": "string", "type": "number|text|progress|enum", "min": 0, "max": 100, "defaultValue": 0 }
  ],
  "specialItemTemplates": [
    {
      "category": "string (e.g. Skill, Technique, Spell, Mutation)",
      "description": "string (what this category represents in the world)",
      "fields": [
        { "name": "string (e.g. Element, Cooldown, Damage)", "type": "text|number|enum" }
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
  });

  const cleaned = text.replace(/\`\`\`json\n?|\`\`\`\n?/g, '').trim();
  return JSON.parse(cleaned) as EnrichWorldResult;
}

export async function enrichCharacter(
  description: string,
  worldContext: string,
  model: Parameters<typeof generateText>[0]['model'],
  language: string
): Promise<EnrichCharacterResult> {
  const { text } = await generateText({
    model,
    system: `You are a character creator for an interactive novel. Given a description and world context, create a detailed character. Respond ONLY with valid JSON matching this schema:
{
  "characterName": "string",
  "characterDescription": "string",
  "suggestedStats": [
    { "k": "string (stat key)", "v": "string|number (value)", "t": "string (type: number|text|progress|enum)" }
  ]
}
Language: ${language}`,
    prompt: `Character description: ${description}\n\nWorld context: ${worldContext}`,
  });

  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
  return JSON.parse(cleaned) as EnrichCharacterResult;
}

export async function enrichChoices(
  context: string,
  model: Parameters<typeof generateText>[0]['model'],
  language: string
): Promise<string[]> {
  const { text } = await generateText({
    model,
    system: `You are a story continuation expert. Given the current story context, suggest 3 engaging choices for the reader. Respond ONLY with a valid JSON array of strings, e.g. ["choice 1", "choice 2", "choice 3"]. Language: ${language}`,
    prompt: context,
  });

  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
  return JSON.parse(cleaned) as string[];
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
  model: Parameters<typeof generateText>[0]['model'],
  language: string
): Promise<EnrichCustomChoiceResult> {
  const { text } = await generateText({
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
  });

  const cleaned = text.replace(/\`\`\`json\n?|\`\`\`\n?/g, '').trim();
  return JSON.parse(cleaned) as EnrichCustomChoiceResult;
}
