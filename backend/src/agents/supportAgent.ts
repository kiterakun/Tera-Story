import { generateText } from 'ai';
import { IResourceTemplate } from '../types/world.types';
import { IDynamicStat } from '../types/character.types';

interface EnrichWorldResult {
  name: string;
  description: string;
  genre: string;
  resourceTemplates: IResourceTemplate[];
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
    system: `You are a world-building assistant for an interactive novel. Given a description, create a detailed world with name, genre (fantasy/sci-fi/wuxia/modern/custom), description, and resource templates (RPG stats). Respond ONLY with valid JSON matching this schema:
{
  "name": "string",
  "description": "string",
  "genre": "fantasy|sci-fi|wuxia|modern|custom",
  "resourceTemplates": [
    { "key": "string", "type": "number|text|progress|enum", "min": 0, "max": 100, "defaultValue": 0, "displayFormat": "{v} HP" }
  ]
}
Language: ${language}`,
    prompt: description,
  });

  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
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
