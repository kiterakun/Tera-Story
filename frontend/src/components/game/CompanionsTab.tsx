import { useState } from 'react';
import { UserRound, Skull, AlertTriangle, HelpCircle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../EntityDetailModal';
import type { Character } from '../../services/playthroughApi';
import { useTranslation } from '../../i18n';
import { getImageUrl } from '../../utils/url';
import { DynamicStatList } from '../DynamicStatDisplay';
import { useStoryStore } from '../../stores/storyStore';

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-500/10',
  dead: 'text-red-400 bg-red-500/10',
  injured: 'text-amber-400 bg-amber-500/10',
  missing: 'text-gray-400 bg-gray-500/10',
};

const STATUS_ICONS: Record<string, typeof UserRound> = {
  active: UserRound,
  dead: Skull,
  injured: AlertTriangle,
  missing: HelpCircle,
};

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
        const StatusIcon = STATUS_ICONS[npc.status] || UserRound;

        return (
          <div
            key={npc._id}
            className="bg-ink-950/50 rounded-xl border border-ink-700/50 overflow-hidden"
          >
            {/* NPC Header */}
            <button
              type="button"
              onClick={() => setExpandedNpcId(isExpanded ? null : npc._id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-ink-800/30 transition-colors"
            >
              {npc.imageUrl ? (
                <img
                  src={getImageUrl(npc.imageUrl)}
                  alt={npc.name}
                  className="w-10 h-10 rounded-lg object-cover border border-ink-700 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center shrink-0">
                  <UserRound size={16} className="text-ink-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-100 truncate">{npc.name}</span>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[npc.status] || STATUS_COLORS.active}`}>
                    <StatusIcon size={10} />
                    {t.entityStatus[npc.status as keyof typeof t.entityStatus] || npc.status}
                  </div>
                </div>
                <p className="text-xs text-ink-200/50 truncate mt-0.5">{npc.description}</p>
              </div>
              <svg
                className={`w-4 h-4 text-ink-200/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

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
