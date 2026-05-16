import { api } from './api';

export interface EnrichWorldResult {
  name: string;
  description: string;
  genre: string;
  resourceTemplates: Array<{
    key: string;
    type: 'number' | 'text' | 'progress' | 'enum' | 'pool';
    min?: number;
    max?: number;
    defaultValue?: string | number;
    displayFormat?: string;
    options?: string[];
  }>;
  locationResourceTemplates?: Array<{
    key: string;
    type: 'number' | 'text' | 'progress' | 'enum' | 'pool';
    min?: number;
    max?: number;
    defaultValue?: string | number;
    displayFormat?: string;
    options?: string[];
  }>;
  specialItemTemplates?: Array<{
    category: string;
    description: string;
    fields: Array<{ name: string; type: 'text' | 'number' | 'enum'; options?: string[] }>;
  }>;
  organizationTemplates?: Array<{
    type: string;
    description: string;
    defaultStats: Array<{
      key: string;
      type: 'number' | 'text' | 'progress' | 'enum' | 'pool';
      min?: number;
      max?: number;
      defaultValue?: string | number;
      displayFormat?: string;
      options?: string[];
    }>;
  }>;
}

export interface EnrichCharacterResult {
  characterName: string;
  characterDescription: string;
  suggestedStats: Array<{ k: string; v: string | number; t: string }>;
  background?: string;
  personality?: string;
  goals?: string;
  appearance?: string;
}

export interface EnrichChoiceResult {
  enrichedChoice: string;
  warnings: string[];
  isValid: boolean;
  suggestions: string[];
}

export async function enrichWorld(description: string, language?: string): Promise<EnrichWorldResult> {
  const { data } = await api.post<{ success: boolean; data: EnrichWorldResult }>('/support/enrich-world', {
    description,
    language,
  });
  return data.data;
}

export async function enrichCharacter(
  description: string,
  worldId?: string,
  language?: string
): Promise<EnrichCharacterResult> {
  const { data } = await api.post<{ success: boolean; data: EnrichCharacterResult }>('/support/enrich-character', {
    description,
    worldId,
    language,
  });
  return data.data;
}

export async function enrichCustomChoice(
  playthroughId: string,
  customChoice: string,
  language?: string
): Promise<EnrichChoiceResult> {
  const { data } = await api.post<{ success: boolean; data: EnrichChoiceResult }>('/support/enrich-custom-choice', {
    playthroughId,
    customChoice,
    language,
  });
  return data.data;
}
