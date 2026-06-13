import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../../EntityDetailModal';
import type { Character } from '../../../services/playthroughApi';
import { useTranslation } from '../../../i18n';
import { getImageUrl } from '../../../utils/url';
import { DynamicStatList } from '../../DynamicStatDisplay';
import { useStoryStore } from '../../../stores/storyStore';
import { EntityCard } from '../../../design-system/EntityCard';

interface CharacterTabProps {
  protagonist: Character | null;
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  t: ReturnType<typeof useTranslation>;
}

export function CharacterTab({ protagonist, setDetailEntity, t }: CharacterTabProps) {
  const world = useStoryStore((state) => state.world);
  if (!protagonist) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">{t.playthrough.noProtagonist}</p>
      </div>
    );
  }

  const statusLabel = t.entityStatus[protagonist.status as keyof typeof t.entityStatus] || protagonist.status;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Character Header */}
      <EntityCard
        variant="character"
        name={protagonist.name}
        subtitle={t.characterCard.protagonist}
        description={protagonist.description}
        imageUrl={protagonist.imageUrl ? getImageUrl(protagonist.imageUrl) : undefined}
        imageAlt={protagonist.name}
        status={protagonist.status}
        statusLabel={statusLabel}
        onClick={() => setDetailEntity({ type: 'character', data: protagonist })}
      />

      {/* Extended Fields */}
      {(protagonist.background || protagonist.personality || protagonist.goals || protagonist.appearance) && (
        <div className="grid grid-cols-1 gap-2">
          {protagonist.background && (
            <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
              <span className="text-[10px] text-ink-200/40 uppercase tracking-wider">{t.playthrough.background}</span>
              <p className="text-xs text-ink-200/70 mt-1 line-clamp-3">{protagonist.background}</p>
            </div>
          )}
          {protagonist.personality && (
            <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
              <span className="text-[10px] text-ink-200/40 uppercase tracking-wider">{t.playthrough.personality}</span>
              <p className="text-xs text-ink-200/70 mt-1 line-clamp-3">{protagonist.personality}</p>
            </div>
          )}
          {protagonist.goals && (
            <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
              <span className="text-[10px] text-ink-200/40 uppercase tracking-wider">{t.playthrough.goals}</span>
              <p className="text-xs text-ink-200/70 mt-1 line-clamp-3">{protagonist.goals}</p>
            </div>
          )}
          {protagonist.appearance && (
            <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
              <span className="text-[10px] text-ink-200/40 uppercase tracking-wider">{t.playthrough.appearance}</span>
              <p className="text-xs text-ink-200/70 mt-1 line-clamp-3">{protagonist.appearance}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {protagonist.dynamicStats.length > 0 && (
        <div>
          <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.storyReader.statsTab}</h4>
          <div className="grid grid-cols-2 gap-2">
            {protagonist.dynamicStats.map((stat, idx) => (
              <div key={idx} className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
                <DynamicStatList stats={[stat]} templates={world?.resourceTemplates} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
