import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../EntityDetailModal';
import type { Character, Item, SpecialItem, Relationship } from '../../services/playthroughApi';
import type { useTranslation } from '../../i18n';
import type { ArchivedEntities } from './tabs/ArchiveTab';
import type { GameTab } from './GameShell';
import { CharacterTab } from './tabs/CharacterTab';
import { CompanionsTab } from './tabs/CompanionsTab';
import { RelationshipsTab } from './tabs/RelationshipsTab';
import { MapTab } from './tabs/MapTab';
import { InventoryTab } from './tabs/InventoryTab';
import { AbilitiesTab } from './tabs/AbilitiesTab';
import { OrganizationsTab } from './tabs/OrganizationsTab';
import { ArchiveTab } from './tabs/ArchiveTab';

interface GamePanelContentProps {
  activeTab: GameTab;
  playthroughId: string;
  protagonist: Character | null;
  sortedNpcs: Character[];
  sortedItems: Item[];
  sortedSpecialItems: SpecialItem[];
  characters: Character[];
  relationships: Relationship[];
  archived: ArchivedEntities | null;
  archiveLoading: boolean;
  restoreEntity: (entityType: 'character' | 'item' | 'special-item' | 'location' | 'organization', entityId: string) => void;
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  setIsRelationshipModalOpen: Dispatch<SetStateAction<boolean>>;
  t: ReturnType<typeof useTranslation>;
}

export function GamePanelContent({
  activeTab,
  playthroughId,
  protagonist,
  sortedNpcs,
  sortedItems,
  sortedSpecialItems,
  characters,
  relationships,
  archived,
  archiveLoading,
  restoreEntity,
  setDetailEntity,
  setIsRelationshipModalOpen,
  t,
}: GamePanelContentProps) {
  switch (activeTab) {
    case 'character':
      return <CharacterTab protagonist={protagonist} setDetailEntity={setDetailEntity} t={t} />;
    case 'companions':
      return <CompanionsTab sortedNpcs={sortedNpcs} setDetailEntity={setDetailEntity} t={t} />;
    case 'relationships':
      return <RelationshipsTab relationships={relationships} characters={characters} setIsRelationshipModalOpen={setIsRelationshipModalOpen} t={t} />;
    case 'map':
      return <MapTab playthroughId={playthroughId} t={t} />;
    case 'inventory':
      return <InventoryTab sortedItems={sortedItems} setDetailEntity={setDetailEntity} t={t} />;
    case 'abilities':
      return <AbilitiesTab sortedSpecialItems={sortedSpecialItems} setDetailEntity={setDetailEntity} t={t} />;
    case 'organizations':
      return <OrganizationsTab setDetailEntity={setDetailEntity} t={t} />;
    case 'archive':
      return <ArchiveTab archived={archived} isLoading={archiveLoading} restoreEntity={restoreEntity} t={t} />;
    default:
      return null;
  }
}
