import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../../EntityDetailModal';
import type { Character } from '../../../services/playthroughApi';
import { useTranslation } from '../../../i18n';
import { getImageUrl } from '../../../utils/url';
import { DynamicStatList } from '../../DynamicStatDisplay';
import { useStoryStore } from '../../../stores/storyStore';
import { EntityCard } from '../../../design-system/EntityCard';

interface CompanionsTabProps {
  sortedNpcs: Character[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  t: ReturnType<typeof useTranslation>;
}

export function CompanionsTab({ sortedNpcs, setDetailEntity, t }: CompanionsTabProps) {
  const world = useStoryStore((state) => state.world);
  const [expandedNpcId, setExpandedNpcId] = useState<string | null>(null);

  if (sortedNpcs.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">{t.playthrough.noCompanions}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {sortedNpcs.map(npc => {
        const isExpanded = expandedNpcId === npc._id;
        const statusLabel = t.entityStatus[npc.status as keyof typeof t.entityStatus] || npc.status;

        return (
          <div
            key={npc._id}
            className="bg-ink-950/50 rounded-xl border border-ink-700/50 overflow-hidden"
          >
            {/* NPC Header */}
            <EntityCard
              variant="character"
              name={npc.name}
              subtitle={t.characterCard.npc}
              description={npc.description}
              imageUrl={npc.imageUrl ? getImageUrl(npc.imageUrl) : undefined}
              imageAlt={npc.name}
              status={npc.status}
              statusLabel={statusLabel}
              selected={isExpanded}
              onClick={() => setExpandedNpcId(isExpanded ? null : npc._id)}
              className="rounded-none border-0 bg-transparent hover:bg-ink-800/30"
              aria-label={`${npc.name}, ${statusLabel}`}
            >
              <span className="block text-[10px] text-ink-200/40">
                {isExpanded ? '▲' : '▼'} {t.playthrough.viewDetails}
              </span>
            </EntityCard>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-ink-700/30 pt-3">
                {/* Extended Fields */}
                {(npc.background || npc.personality || npc.goals || npc.appearance) && (
                  <div className="grid grid-cols-1 gap-2">
                    {npc.background && (
                      <div className="bg-ink-900/50 rounded-lg p-2">
                        <span className="text-[10px] text-ink-200/40 uppercase tracking-wider">{t.playthrough.background}</span>
                        <p className="text-xs text-ink-200/70 mt-0.5 line-clamp-2">{npc.background}</p>
                      </div>
                    )}
                    {npc.personality && (
                      <div className="bg-ink-900/50 rounded-lg p-2">
                        <span className="text-[10px] text-ink-200/40 uppercase tracking-wider">{t.playthrough.personality}</span>
                        <p className="text-xs text-ink-200/70 mt-0.5 line-clamp-2">{npc.personality}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                {npc.dynamicStats.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {npc.dynamicStats.map((stat, idx) => (
                      <div key={idx} className="bg-ink-900/50 rounded px-2 py-1">
                        <DynamicStatList stats={[stat]} templates={world?.resourceTemplates} compact />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setDetailEntity({ type: 'character', data: npc })}
                  className="w-full text-xs text-accent-400 hover:text-accent-300 py-1.5 transition-colors"
                >
                  {t.playthrough.viewDetails}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
