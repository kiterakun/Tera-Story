import { IResourceTemplate, ISpecialItemTemplate } from '../types/world.types';

interface WorldTemplateData {
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  resourceTemplates: IResourceTemplate[];
  specialItemTemplates?: ISpecialItemTemplate[];
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
    specialItemTemplates: [
      {
        category: 'Spell',
        description: 'Magical spells that characters can learn and cast',
        fields: [
          { name: 'Element', type: 'enum', options: ['Fire', 'Ice', 'Lightning', 'Earth', 'Wind', 'Light', 'Dark'] },
          { name: 'ManaCost', type: 'number' },
          { name: 'Cooldown', type: 'text' },
        ],
      },
      {
        category: 'Skill',
        description: 'Combat and utility skills acquired through training',
        fields: [
          { name: 'SkillType', type: 'enum', options: ['Passive', 'Active', 'Toggle'] },
          { name: 'StaminaCost', type: 'number' },
        ],
      },
      {
        category: 'Blessing',
        description: 'Divine or magical blessings bestowed by powerful entities',
        fields: [
          { name: 'Source', type: 'text' },
          { name: 'Duration', type: 'text' },
        ],
      },
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
    specialItemTemplates: [
      {
        category: 'Technique',
        description: 'Martial arts techniques and combat forms',
        fields: [
          { name: 'Style', type: 'enum', options: ['Sword', 'Fist', 'Palm', 'Finger', 'Leg', 'Body'] },
          { name: 'QiCost', type: 'number' },
          { name: 'Rank', type: 'enum', options: ['Mortal', 'Earth', 'Heaven', 'Saint', 'Divine'] },
        ],
      },
      {
        category: 'Spiritual Root',
        description: 'Innate spiritual roots that determine cultivation affinity',
        fields: [
          { name: 'Element', type: 'enum', options: ['Metal', 'Wood', 'Water', 'Fire', 'Earth', 'Wind', 'Lightning'] },
          { name: 'Purity', type: 'enum', options: ['Impure', 'Normal', 'Pure', 'Heavenly'] },
        ],
      },
      {
        category: 'Cultivation Method',
        description: 'Cultivation manuals and methods for advancing spiritual power',
        fields: [
          { name: 'Rank', type: 'enum', options: ['Mortal', 'Earth', 'Heaven', 'Saint', 'Divine'] },
          { name: 'Stages', type: 'number' },
        ],
      },
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
    specialItemTemplates: [
      {
        category: 'Augmentation',
        description: 'Cybernetic or biological augmentations that enhance abilities',
        fields: [
          { name: 'BodyPart', type: 'enum', options: ['Neural', 'Ocular', 'Skeletal', 'Dermal', 'Cardiovascular'] },
          { name: 'EnergyCost', type: 'number' },
        ],
      },
      {
        category: 'Program',
        description: 'Software programs and hacking tools for digital warfare',
        fields: [
          { name: 'ProgramType', type: 'enum', options: ['Offensive', 'Defensive', 'Utility', 'Stealth'] },
          { name: 'MemoryUsage', type: 'number' },
        ],
      },
      {
        category: 'Mutation',
        description: 'Genetic mutations gained through exposure or experimentation',
        fields: [
          { name: 'Stability', type: 'enum', options: ['Stable', 'Unstable', 'Volatile'] },
          { name: 'Side Effects', type: 'text' },
        ],
      },
    ],
  },
};
