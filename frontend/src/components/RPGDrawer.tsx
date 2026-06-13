import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from './EntityDetailModal';
import type { Character, Item, Relationship, SpecialItem } from '../services/playthroughApi';
import type { ResourceTemplate } from '@/types/entities';
import { useTranslation } from '../i18n';
import { Drawer, DrawerBody } from '../design-system';
import RPGPanel from './RPGPanel';

export type RpgTab = 'stats' | 'inventory' | 'abilities' | 'relations';

interface RPGDrawerProps {
  open: boolean;
  onClose: () => void;
  rpgTab: RpgTab;
  setRpgTab: Dispatch<SetStateAction<RpgTab>>;
  tabLabels: Record<RpgTab, string>;
  protagonist: Character | null;
  sortedNpcs: Character[];
  sortedItems: Item[];
  sortedSpecialItems: SpecialItem[];
  characters: Character[];
  relationships: Relationship[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  setIsRelationshipModalOpen: Dispatch<SetStateAction<boolean>>;
  isRelationshipModalOpen: boolean;
  resourceTemplates?: ResourceTemplate[];
}

export function RPGDrawer({
  open,
  onClose,
  rpgTab,
  setRpgTab,
  tabLabels,
  protagonist,
  sortedNpcs,
  sortedItems,
  sortedSpecialItems,
  characters,
  relationships,
  setDetailEntity,
  setIsRelationshipModalOpen,
  isRelationshipModalOpen,
  resourceTemplates,
}: RPGDrawerProps) {
  const t = useTranslation();
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t.storyReader.rpgPanel}
      side="right"
      width="md"
    >
      <DrawerBody>
        <RPGPanel
          rpgTab={rpgTab}
          setRpgTab={setRpgTab}
          tabLabels={tabLabels}
          protagonist={protagonist}
          sortedNpcs={sortedNpcs}
          sortedItems={sortedItems}
          sortedSpecialItems={sortedSpecialItems}
          characters={characters}
          relationships={relationships}
          setDetailEntity={setDetailEntity}
          setIsRelationshipModalOpen={setIsRelationshipModalOpen}
          isRelationshipModalOpen={isRelationshipModalOpen}
          t={t}
          resourceTemplates={resourceTemplates}
        />
      </DrawerBody>
    </Drawer>
  );
}

export default RPGDrawer;
