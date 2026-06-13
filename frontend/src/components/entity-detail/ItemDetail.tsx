import { Package } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Item } from '../../services/playthroughApi';
import { EntityCard } from '../../design-system/EntityCard';
import { getRarityStyle } from '../../design-system/colors';
import { HeroImage } from './HeroImage';

export function ItemDetail({ data }: { data: Item }) {
  const t = useTranslation();
  const rc = getRarityStyle(data.rarity);
  const statusLabel = t.entityStatus[data.status as keyof typeof t.entityStatus] || data.status;
  return (
    <div className="space-y-4">
      <HeroImage
        imageUrl={data.imageUrl}
        alt={data.name}
        entityType="item"
        entityId={data._id}
        fallbackIcon={<Package size={36} className="text-ink-200/40" />}
        borderClass={rc.border}
      />
      <EntityCard
        variant="item"
        name={data.name}
        rarity={data.rarity}
        rarityLabel={t.rarity[data.rarity as keyof typeof t.rarity] || data.rarity}
        status={data.status !== 'active' ? data.status : undefined}
        statusLabel={data.status !== 'active' ? statusLabel : undefined}
        description={data.description}
      />
      {Object.keys(data.properties || {}).length > 0 && (
        <div>
          <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.itemDetail.properties}</h4>
          <div className="space-y-1.5">
            {Object.entries(data.properties).map(([key, val]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-ink-200/70">{key}</span>
                <span className="text-ink-100 font-mono">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
