import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../EntityDetailModal';
import type { Character, Item, SpecialItem, Relationship } from '../../services/playthroughApi';
import { useTranslation } from '../../i18n';
import { useArchive } from '../../hooks/useArchive';
import { GameShell, type GameTab } from './GameShell';
import { GamePanelContent } from './GamePanelContent';

interface GamePanelProps {
  isOpen: boolean;
  onClose: () => void;
  playthroughId: string;
  protagonist: Character | null;
  sortedNpcs: Character[];
  sortedItems: Item[];
  sortedSpecialItems: SpecialItem[];
  characters: Character[];
  relationships: Relationship[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  setIsRelationshipModalOpen: Dispatch<SetStateAction<boolean>>;
  t: ReturnType<typeof useTranslation>;
}

export default function GamePanel({ isOpen, onClose, playthroughId, protagonist, sortedNpcs, sortedItems, sortedSpecialItems, characters, relationships, setDetailEntity, setIsRelationshipModalOpen, t }: GamePanelProps) {
  const [activeTab, setActiveTab] = useState<GameTab>('character');
  const { archived, isLoading: archiveLoading, fetchArchived, restoreEntity } = useArchive(playthroughId);

  useEffect(() => {
    if (isOpen && activeTab === 'archive') fetchArchived();
  }, [isOpen, activeTab, fetchArchived]);

  if (!isOpen) return null;

  return (
    <GameShell activeTab={activeTab} onTabChange={setActiveTab} onClose={onClose} t={t}>
      <GamePanelContent
        activeTab={activeTab}
        playthroughId={playthroughId}
        protagonist={protagonist}
        sortedNpcs={sortedNpcs}
        sortedItems={sortedItems}
        sortedSpecialItems={sortedSpecialItems}
        characters={characters}
        relationships={relationships}
        archived={archived}
        archiveLoading={archiveLoading}
        restoreEntity={restoreEntity}
        setDetailEntity={setDetailEntity}
        setIsRelationshipModalOpen={setIsRelationshipModalOpen}
        t={t}
      />
    </GameShell>
  );
}
