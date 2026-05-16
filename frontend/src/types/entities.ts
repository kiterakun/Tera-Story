export interface DynamicStat {
  k: string;
  v: number | string | boolean;
  t: string;
  maxV?: number; // only for 'pool' type
}

export type CharacterStatus = 'active' | 'dead' | 'injured' | 'missing';
export type ItemStatus = 'active' | 'destroyed' | 'lost' | 'consumed';
export type SpecialItemStatus = 'active' | 'sealed' | 'lost' | 'consumed';

export interface Character {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  role: 'protagonist' | 'npc';
  status: CharacterStatus;
  dynamicStats: DynamicStat[];
  background: string;
  personality: string;
  goals: string;
  appearance: string;
  playthroughId: string;
  worldId: string;
  userId: string;
  createdInChapterId?: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Arc { 
  _id: string; 
  title: string; 
  summary?: string; 
  arcIndex: number; 
  status: 'active' | 'completed'; 
}

export interface Playthrough {
  _id: string; 
  name: string; 
  worldId: string; 
  status: 'active' | 'paused' | 'completed';
  currentArcIndex: number; 
  createdAt: string;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
  _id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  status: ItemStatus;
  imageUrl?: string;
  ownerId?: string;
  playthroughId: string;
  createdInChapterId?: string;
  properties: Record<string, unknown>;
  archivedAt?: string | null;
  createdAt: string;
}

export interface SpecialItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  rarity: ItemRarity;
  status: SpecialItemStatus;
  imageUrl?: string;
  ownerId?: string;
  playthroughId: string;
  createdInChapterId?: string;
  customFields: Record<string, unknown>;
  archivedAt?: string | null;
  createdAt: string;
}

export interface ConsequenceSeed {
  _id: string;
  description: string;
  triggerChapterIndex: number;
  minChapterDelay: number;
  activated: boolean;
  activatedInChapterId?: string;
  impact: 'minor' | 'major' | 'critical';
  tags: string[];
  createdAt: string;
}

export interface ResourceTemplate {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum' | 'pool';
  min?: number;
  max?: number;
  defaultValue?: string | number;
  displayFormat?: string;
  options?: string[];
}

export interface SpecialItemFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'enum';
  options?: string[];
  required?: boolean;
}

export interface SpecialItemTemplate {
  _id?: string;
  worldId?: string;
  category: string;
  description: string;
  fields: SpecialItemFieldDefinition[];
}

export interface World {
  _id: string;
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  imageUrl?: string;
  resourceTemplates: ResourceTemplate[];
  locationResourceTemplates: ResourceTemplate[];
  createdAt: string;
  updatedAt: string;
}
