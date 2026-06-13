import { UserRound, Skull, AlertTriangle, HelpCircle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../../EntityDetailModal';
import type { Character } from '../../../services/playthroughApi';
import { useTranslation } from '../../../i18n';
import { getImageUrl } from '../../../utils/url';
import { DynamicStatList } from '../../DynamicStatDisplay';
import { useStoryStore } from '../../../stores/storyStore';

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

  const StatusIcon = STATUS_ICONS[protagonist.status] || UserRound;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Character Header */}
      <div className="flex items-start gap-4">
        <div
          className="cursor-pointer shrink-0"
          onClick={() => setDetailEntity({ type: 'character', data: protagonist })}
        >
          {protagonist.imageUrl ? (
            <img
              src={getImageUrl(protagonist.imageUrl)}
              alt={protagonist.name}
              className="w-16 h-16 rounded-xl object-cover border border-ink-700 hover:border-accent-400 transition-colors"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-ink-800 border border-ink-700 flex items-center justify-center hover:border-accent-400 transition-colors">
              <UserRound size={24} className="text-ink-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-ink-100 truncate">{protagonist.name}</h3>
          <p className="text-xs text-ink-200/50 mt-0.5 line-clamp-2">{protagonist.description}</p>
          <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[protagonist.status] || STATUS_COLORS.active}`}>
            <StatusIcon size={12} />
            {t.entityStatus[protagonist.status as keyof typeof t.entityStatus] || protagonist.status}
          </div>
        </div>
      </div>

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
