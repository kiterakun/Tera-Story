import { api } from './api';
import type {
  Arc,
  Character,
  CombatActionResponse,
  CombatEncounter,
  ConsequenceSeed,
  Item,
  Playthrough,
  Relationship,
  SpecialItem,
} from '@/types';

export type { Character, Item, SpecialItem, Arc, Playthrough, Relationship, RelationType, DynamicStat, CharacterStatus, ItemStatus, SpecialItemStatus, ItemRarity, CombatEncounter, CombatCombatant, CombatRound, CombatActionResponse, ConsequenceSeed } from '@/types';

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

export async function listRelationships(playthroughId: string): Promise<Relationship[]> {
  const { data } = await api.get<{ relationships: Relationship[] }>(`/playthroughs/${playthroughId}/relationships`);
  return data.relationships;
}

export async function listConsequences(playthroughId: string): Promise<ConsequenceSeed[]> {
  const { data } = await api.get<{ consequences: ConsequenceSeed[] }>(`/playthroughs/${playthroughId}/consequences`);
  return data.consequences;
}

export async function getActiveCombat(playthroughId: string): Promise<CombatEncounter | null> {
  const { data } = await api.get<{ combat: CombatEncounter | null }>(`/playthroughs/${playthroughId}/combat`);
  return data.combat;
}

export async function performCombatAction(combatId: string, action: string): Promise<CombatActionResponse> {
  const { data } = await api.post<CombatActionResponse>(`/combat/${combatId}/action`, { action });
  return data;
}