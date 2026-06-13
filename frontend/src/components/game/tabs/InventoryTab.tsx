import type { Dispatch, SetStateAction } from 'react';
import type { Item } from '../../../services/playthroughApi';
import type { EntityData } from '../../EntityDetailModal';
import type { useTranslation } from '../../../i18n';
import { ItemCard } from '../../../design-system';

interface InventoryTabProps {
  sortedItems: Item[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  t: ReturnType<typeof useTranslation>;
}

export function InventoryTab({ sortedItems, setDetailEntity, t }: InventoryTabProps) {
  if (sortedItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">{t.characterPanel.noItems}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
      {sortedItems.map((item) => (
        <ItemCard
          key={item._id}
          item={item}
          rarityLabel={t.rarity[item.rarity as keyof typeof t.rarity] || item.rarity}
          onOpen={() => setDetailEntity({ type: 'item', data: item })}
        />
      ))}
    </div>
  );
}
