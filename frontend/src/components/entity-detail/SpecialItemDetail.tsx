import { Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { SpecialItem } from '../../services/playthroughApi';
import { useStoryStore } from '../../stores/storyStore';
import { EntityCard } from '../../design-system/EntityCard';
import { getRarityStyle } from '../../design-system/colors';
import { HeroImage } from './HeroImage';

export function SpecialItemDetail({ data }: { data: SpecialItem }) {
  const t = useTranslation();
  const { specialItemTemplates } = useStoryStore();
  const rc = getRarityStyle(data.rarity);
  const statusLabel = t.entityStatus[data.status as keyof typeof t.entityStatus] || data.status;
  return (
    <div className="space-y-4">
      <HeroImage
        imageUrl={data.imageUrl}
        alt={data.name}
        entityType="special-item"
        entityId={data._id}
        fallbackIcon={<Sparkles size={36} className="text-purple-400/40" />}
        borderClass={rc.border}
      />
      <EntityCard
        variant="special-item"
        name={data.name}
        subtitle={data.category}
        rarity={data.rarity}
        rarityLabel={t.rarity[data.rarity as keyof typeof t.rarity] || data.rarity}
        status={data.status !== 'active' ? data.status : undefined}
        statusLabel={data.status !== 'active' ? statusLabel : undefined}
        description={data.description}
      />
      {Object.keys(data.customFields || {}).length > 0 && (
        <div>
          <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.itemDetail.properties}</h4>
          <div className="space-y-2">
            {Object.entries(data.customFields).map(([key, val]) => {
              const template = specialItemTemplates.find((tmpl) => tmpl.category === data.category);
              const fieldDef = template?.fields.find((f) => f.name === key || (f as { key?: string }).key === key);
              return (
                <div key={key} className="bg-ink-950/40 rounded-lg p-2 border border-ink-700/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-ink-200/60">{fieldDef?.name || key}</span>
                    <span className="text-sm text-ink-100 font-medium">{String(val)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
