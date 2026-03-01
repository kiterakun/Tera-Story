import { api } from './api';

export interface DynamicStat { 
  k: string; 
  v: number | string; 
  t: string; 
}

export interface Character {
  _id: string; 
  name: string; 
  description: string; 
  imageUrl?: string;
  role: 'protagonist' | 'npc'; 
  dynamicStats: DynamicStat[]; 
  playthroughId: string; 
  worldId: string;
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