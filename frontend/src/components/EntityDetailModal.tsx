import type { Character, Item, SpecialItem } from '../services/playthroughApi';
import type { Organization } from '../types/entities';
import { Modal, ModalBody } from '../design-system';
import { RARITY_STYLES } from '../design-system/colors';
import { CharacterDetail } from './entity-detail/CharacterDetail';
import { ItemDetail } from './entity-detail/ItemDetail';
import { SpecialItemDetail } from './entity-detail/SpecialItemDetail';
import { OrganizationDetail } from './entity-detail/OrganizationDetail';

type EntityData =
  | { type: 'character'; data: Character }
  | { type: 'item'; data: Item }
  | { type: 'special'; data: SpecialItem }
  | { type: 'organization'; data: Organization };

interface EntityDetailModalProps {
  entity: EntityData | null;
  onClose: () => void;
}

export function EntityDetailModal({ entity, onClose }: EntityDetailModalProps) {
  if (!entity) return null;
  const rarity = entity.type === 'item' || entity.type === 'special' ? entity.data.rarity : null;
  const rc = rarity ? RARITY_STYLES[rarity] : null;
  return (
    <Modal
      open={!!entity}
      onClose={onClose}
      title={entity.data.name}
      size="md"
      className={`rounded-3xl ${rc ? `${rc.border} ${rc.glow}` : 'border-ink-700'}`}
    >
      {rarity === 'legendary' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-pulse" />
        </div>
      )}
      {rarity === 'epic' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5 animate-pulse" />
        </div>
      )}
      <ModalBody className="relative pt-2">
        {entity.type === 'character' && <CharacterDetail data={entity.data} />}
        {entity.type === 'item' && <ItemDetail data={entity.data} />}
        {entity.type === 'special' && <SpecialItemDetail data={entity.data} />}
        {entity.type === 'organization' && <OrganizationDetail data={entity.data} />}
      </ModalBody>
    </Modal>
  );
}

export type { EntityData };
