import { api } from './api';

export interface DynamicStat { 
  k: string; 
  v: number | string | boolean; 
  t: string; 
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
  playthroughId: string; 
  worldId: string;
  userId: string;
  createdInChapterId?: string;
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

// Playthrough calls
export async function listPlaythroughs(worldId: string): Promise<Playthrough[]> {
  const { data } = await api.get<{ playthroughs: Playthrough[] }>(`/worlds/${worldId}/playthroughs`);
  return data.playthroughs;
}

export async function getPlaythrough(id: string): Promise<Playthrough> {
  const { data } = await api.get<{ playthrough: Playthrough }>(`/playthroughs/${id}`);
  return data.playthrough;
}

export async function createPlaythrough(worldId: string, name: string): Promise<Playthrough> {
  const { data } = await api.post<{ playthrough: Playthrough }>(`/worlds/${worldId}/playthroughs`, { name });
  return data.playthrough;
}

export async function deletePlaythrough(id: string): Promise<void> {
  await api.delete(`/playthroughs/${id}`);
}

// Character calls
export async function listCharacters(playthroughId: string): Promise<Character[]> {
  const { data } = await api.get<{ characters: Character[] }>(`/playthroughs/${playthroughId}/characters`);
  return data.characters;
}

export async function createCharacter(
  playthroughId: string, 
  characterData: { name: string; description: string; role: 'protagonist' | 'npc' }
): Promise<Character> {
  const { data } = await api.post<{ character: Character }>(`/playthroughs/${playthroughId}/characters`, characterData);
  return data.character;
}

// Arc calls
export async function listArcs(playthroughId: string): Promise<Arc[]> {
  const { data } = await api.get<{ arcs: Arc[] }>(`/playthroughs/${playthroughId}/arcs`);
  return data.arcs;
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
  createdAt: string;
}


// Item calls
export async function listItems(playthroughId: string): Promise<Item[]> {
  const { data } = await api.get<{ items: Item[] }>(`/playthroughs/${playthroughId}/items`);
  return data.items;
}

// Special Item calls
export async function listSpecialItems(playthroughId: string, category?: string): Promise<SpecialItem[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const { data } = await api.get<{ specialItems: SpecialItem[] }>(`/playthroughs/${playthroughId}/special-items${params}`);
  return data.specialItems;
}

export async function listSpecialItemsByOwner(playthroughId: string, characterId: string): Promise<SpecialItem[]> {
  const { data } = await api.get<{ specialItems: SpecialItem[] }>(`/playthroughs/${playthroughId}/special-items/by-owner/${characterId}`);
  return data.specialItems;
}

// Relationship types
export type RelationType = 'ally' | 'enemy' | 'romantic' | 'mentor' | 'rival' | 'neutral' | 'family';

export interface Relationship {
  _id: string;
  characterA: { _id: string; name: string };
  characterB: { _id: string; name: string };
  type: RelationType;
  intensity: number;
}

export async function listRelationships(playthroughId: string): Promise<Relationship[]> {
  const { data } = await api.get<{ relationships: Relationship[] }>(`/playthroughs/${playthroughId}/relationships`);
  return data.relationships;
}

// Consequence types
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

export async function listConsequences(playthroughId: string): Promise<ConsequenceSeed[]> {
  const { data } = await api.get<{ consequences: ConsequenceSeed[] }>(`/playthroughs/${playthroughId}/consequences`);
  return data.consequences;
}

// Combat types
export interface CombatCombatant {
  characterId: string;
  name: string;
  side: 'player' | 'enemy';
  currentHp: number;
  maxHp: number;
  defeated: boolean;
}

export interface CombatRound {
  roundIndex: number;
  playerAction: string;
  narrative: string;
  stateChanges: Array<{ characterName: string; stat: string; oldValue: number; newValue: number }>;
}

export interface CombatEncounter {
  _id: string;
  playthroughId: string;
  chapterId: string;
  combatants: CombatCombatant[];
  rounds: CombatRound[];
  status: 'active' | 'victory' | 'defeat' | 'fled' | 'resolved';
  context: string;
  availableActions: string[];
}

export async function getActiveCombat(playthroughId: string): Promise<CombatEncounter | null> {
  const { data } = await api.get<{ combat: CombatEncounter | null }>(`/playthroughs/${playthroughId}/combat`);
  return data.combat;
}

export interface CombatActionResponse {
  success: boolean;
  narrative: string;
  combat: CombatEncounter;
  stateChanges: Array<{ characterName: string; stat: string; oldValue: number; newValue: number }>;
}

export async function performCombatAction(combatId: string, action: string): Promise<CombatActionResponse> {
  const { data } = await api.post<CombatActionResponse>(`/combat/${combatId}/action`, { action });
  return data;
}