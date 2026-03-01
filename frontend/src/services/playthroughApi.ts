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
  level: number; 
  health: number; 
  mana: number;
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
