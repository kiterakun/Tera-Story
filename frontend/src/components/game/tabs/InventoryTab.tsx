import { Package } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { Item } from '../../../services/playthroughApi';
import type { EntityData } from '../../EntityDetailModal';
import type { useTranslation } from '../../../i18n';
import { getImageUrl } from '../../../utils/url';
import { rarityTextBorder } from '../../../design-system/colors';

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
      {sortedItems.map((item) => {
        const rarityColor = rarityTextBorder(item.rarity);
        return (
          <button
            key={item._id}
            type="button"
            onClick={() => setDetailEntity({ type: 'item', data: item })}
            className={`bg-ink-950/50 rounded-xl border p-3 cursor-pointer hover:border-ink-600 transition-colors text-left ${rarityColor}`}
            aria-label={`${item.name}, ${t.rarity[item.rarity as keyof typeof t.rarity] || item.rarity}`}
          >
            <div className="w-12 h-12 rounded-lg bg-ink-900 border border-ink-700 overflow-hidden mb-2 mx-auto">
              {item.imageUrl ? (
                <img
                  src={getImageUrl(item.imageUrl)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={20} className="text-ink-500" aria-hidden="true" />
                </div>
              )}
            </div>
            <h4 className="text-sm font-display text-ink-100 text-center truncate">{item.name}</h4>
            <p className="text-[10px] text-center capitalize mt-0.5">
              {t.rarity[item.rarity as keyof typeof t.rarity] || item.rarity}
            </p>
          </button>
        );
      })}
    </div>
  );
}
