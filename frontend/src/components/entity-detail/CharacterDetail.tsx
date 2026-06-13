import { UserRound } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Character } from '../../services/playthroughApi';
import { getImageUrl } from '../../utils/url';
import { DynamicStatList } from '../DynamicStatDisplay';
import { useStoryStore } from '../../stores/storyStore';
import { EntityCard } from '../../design-system/EntityCard';
import { HeroImage } from './HeroImage';

export function CharacterDetail({ data }: { data: Character }) {
  const t = useTranslation();
  const { world } = useStoryStore();
  const statusLabel = t.entityStatus[data.status as keyof typeof t.entityStatus] || data.status;
  return (
    <div className="space-y-4">
      <HeroImage
        imageUrl={data.imageUrl}
        alt={data.name}
        entityType="character"
        entityId={data._id}
        fallbackIcon={<UserRound size={40} className="text-ink-200/40" />}
        borderClass="border-accent-400/30"
      />
      <EntityCard
        variant="character"
        name={data.name}
        subtitle={data.role === 'protagonist' ? t.characterPanel.protagonist : 'NPC'}
        description={data.description}
        imageUrl={data.imageUrl ? getImageUrl(data.imageUrl) : undefined}
        imageAlt={data.name}
        status={data.status !== 'active' ? data.status : undefined}
        statusLabel={data.status !== 'active' ? statusLabel : undefined}
      />
      {(data.background || data.personality || data.goals || data.appearance) && (
        <div className="space-y-3">
          {data.background && (
            <div>
              <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.background}</h4>
              <p className="text-ink-200/80 text-sm leading-relaxed">{data.background}</p>
            </div>
          )}
          {data.personality && (
            <div>
              <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.personality}</h4>
              <p className="text-ink-200/80 text-sm leading-relaxed">{data.personality}</p>
            </div>
          )}
          {data.goals && (
            <div>
              <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.goals}</h4>
              <p className="text-ink-200/80 text-sm leading-relaxed">{data.goals}</p>
            </div>
          )}
          {data.appearance && (
            <div>
              <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.appearance}</h4>
              <p className="text-ink-200/80 text-sm leading-relaxed">{data.appearance}</p>
            </div>
          )}
        </div>
      )}
      {data.dynamicStats.length > 0 && (
        <div>
          <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.storyReader.statsTab}</h4>
          <DynamicStatList stats={data.dynamicStats} templates={world?.resourceTemplates} />
        </div>
      )}
    </div>
  );
}
