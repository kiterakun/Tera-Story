import { api } from './api';
import type { Character, Item, SpecialItem, Organization } from '@/types/entities';
import type { Location } from './mapApi';

export interface ArchivedEntities {
  characters: Character[];
  items: Item[];
  specialItems: SpecialItem[];
  locations: Location[];
  organizations: Organization[];
}

export async function getArchivedEntities(playthroughId: string): Promise<ArchivedEntities> {
  const { data } = await api.get<ArchivedEntities>(`/archive/${playthroughId}`);
  return data;
}

export async function restoreEntity(
  playthroughId: string,
  entityType: 'character' | 'item' | 'special-item' | 'location' | 'organization',
  entityId: string
): Promise<{ restored: boolean; entityType: string; entityId: string }> {
  const { data } = await api.post(`/archive/${playthroughId}/restore`, {
    entityType,
    entityId,
  });
  return data;
}
