import type { Dispatch, SetStateAction } from 'react';
import type { SpecialItem } from '../../../services/playthroughApi';
import type { EntityData } from '../../EntityDetailModal';
import type { useTranslation } from '../../../i18n';
import { AbilityCard } from '../../../design-system';

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
            {items.map((si) => (
              <AbilityCard
                key={si._id}
                ability={si}
                rarityLabel={t.rarity[si.rarity as keyof typeof t.rarity] || si.rarity}
                onOpen={() => setDetailEntity({ type: 'special', data: si })}
                className="bg-ink-950/50"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
