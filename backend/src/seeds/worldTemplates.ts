import { IResourceTemplate } from '../types/world.types';

interface WorldTemplateData {
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  resourceTemplates: IResourceTemplate[];
}

export const WORLD_TEMPLATES: Record<string, WorldTemplateData> = {
  fantasy: {
    name: 'Fantasy World',
    description: 'A classic fantasy world with magic, swords, and adventure.',
    genre: 'fantasy',
    resourceTemplates: [
      { key: 'HP', type: 'number', min: 0, max: 100, defaultValue: 100 },
      { key: 'MP', type: 'number', min: 0, max: 100, defaultValue: 100 },
      { key: 'Strength', type: 'number', min: 0, max: 50, defaultValue: 10 },
      { key: 'Intelligence', type: 'number', min: 0, max: 50, defaultValue: 10 },
      { key: 'Agility', type: 'number', min: 0, max: 50, defaultValue: 10 },
      { key: 'Level', type: 'number', min: 1, max: 100, defaultValue: 1 },
      { key: 'Experience', type: 'number', min: 0, max: 10000, defaultValue: 0 },
    ],
  },
  wuxia: {
    name: 'Wuxia World',
    description: 'A martial arts cultivation world with spiritual energy and ancient techniques.',
    genre: 'wuxia',
    resourceTemplates: [
      { key: 'CultivationStage', type: 'text', defaultValue: 'Mortal' },
      { key: 'Qi', type: 'number', min: 0, max: 1000, defaultValue: 100 },
      { key: 'BodyTempering', type: 'number', min: 0, max: 100, defaultValue: 0 },
      { key: 'SpiritPower', type: 'number', min: 0, max: 500, defaultValue: 50 },
    ],
  },
  scifi: {
    name: 'Sci-Fi World',
    description: 'A futuristic science fiction world with advanced technology and space exploration.',
    genre: 'sci-fi',
    resourceTemplates: [
      { key: 'Energy', type: 'number', min: 0, max: 1000, defaultValue: 500 },
      { key: 'TechLevel', type: 'number', min: 1, max: 10, defaultValue: 1 },
      { key: 'Credits', type: 'number', min: 0, max: 999999, defaultValue: 1000 },
      { key: 'Reputation', type: 'number', min: -100, max: 100, defaultValue: 0 },
    ],
  },
};
