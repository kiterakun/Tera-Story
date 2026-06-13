import { Sparkles } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { SpecialItem } from '../../../services/playthroughApi';
import type { EntityData } from '../../EntityDetailModal';
import type { useTranslation } from '../../../i18n';
import { rarityTextBorder } from '../../../design-system/colors';

interface AbilitiesTabProps {
  sortedSpecialItems: SpecialItem[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  t: ReturnType<typeof useTranslation>;
}

export function AbilitiesTab({ sortedSpecialItems, setDetailEntity, t }: AbilitiesTabProps) {
  if (sortedSpecialItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">{t.characterPanel.noSpecialItems}</p>
      </div>
    );
  }

  const grouped: Record<string, SpecialItem[]> = {};
  sortedSpecialItems.forEach((si) => {
    const cat = si.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(si);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">{category}</h4>
          <div className="space-y-2">
            {items.map((si) => {
              const rarityColor = rarityTextBorder(si.rarity);
              return (
                <button
                  key={si._id}
                  type="button"
                  onClick={() => setDetailEntity({ type: 'special', data: si })}
                  className={`w-full bg-ink-950/50 rounded-xl border p-3 cursor-pointer hover:border-ink-600 transition-colors text-left ${rarityColor}`}
                  aria-label={`${si.name}, ${t.rarity[si.rarity as keyof typeof t.rarity] || si.rarity}`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} aria-hidden="true" />
                    <span className="text-sm font-display text-ink-100">{si.name}</span>
                    <span className="text-[10px] capitalize text-ink-200/40 ml-auto">
                      {t.rarity[si.rarity as keyof typeof t.rarity] || si.rarity}
                    </span>
                  </div>
                  {si.description && (
                    <p className="text-xs text-ink-200/50 mt-1 line-clamp-2">{si.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
