import type { FC } from 'react';
import { BookOpen, Swords, Target, Star, CreditCard, Gift } from 'lucide-react';
import type { DailyQuest } from '../../services/dailyApi';
import { useTranslation } from '../../i18n';

interface DailyQuestsWidgetProps {
  quests: DailyQuest[];
  isLoading?: boolean;
  error?: string | null;
  onClaim: (questId: string) => Promise<void>;
}

const questIcons: Record<string, typeof BookOpen> = {
  read_scenes: BookOpen,
  make_choices: Target,
  win_combat: Swords,
  unlock_achievement: Star,
  collect_card: CreditCard,
};




export const DailyQuestsWidget: FC<DailyQuestsWidgetProps> = ({
  quests,
  isLoading = false,
  error = null,
  onClaim,
}) => {
  const t = useTranslation();
  return (
    <div className="bg-ink-900 border border-ink-700 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-gold shrink-0" />
        <h3 className="text-sm font-semibold text-ink-100">{t.daily.todayQuests}</h3>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-ink-800 rounded-lg p-3">
              <div className="w-8 h-8 bg-ink-700 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-ink-700 rounded w-2/3" />
                <div className="h-2 bg-ink-700 rounded-full w-full" />
              </div>
              <div className="w-16 h-7 bg-ink-700 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error state */
        <div className="text-center py-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : quests.length === 0 ? (
        /* Empty state — all done */
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 text-gold" />
          </div>
          <p className="text-sm text-ink-300 font-medium">
            {t.daily.allQuestsDone}
          </p>
          <p className="text-xs text-ink-500 mt-1">
            {t.daily.backTomorrow}
          </p>
        </div>
      ) : (
        /* Quest list */
        <div className="space-y-2">
          {quests.map((quest) => {
            const Icon = questIcons[quest.questType] ?? Gift;
            const progressPct =
              quest.targetProgress > 0
                ? Math.min(100, Math.round((quest.currentProgress / quest.targetProgress) * 100))
                : 0;

            return (
              <div
                key={quest._id}
                className="flex items-center gap-3 bg-ink-800/50 border border-ink-700/50 rounded-lg p-3"
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${quest.completed ? 'bg-emerald-500/20' : 'bg-ink-700'}`}>
                  <Icon className={`w-4 h-4 ${quest.completed ? 'text-emerald-400' : 'text-ink-400'}`} />
                </div>

                {/* Info + Progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-300 truncate">
                    {t.daily.questDesc[quest.questType as keyof typeof t.daily.questDesc]?.replace('{count}', String(quest.targetProgress)) ?? quest.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                          quest.completed
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-gold to-amber-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-500 shrink-0">
                      {quest.currentProgress}/{quest.targetProgress}
                    </span>
                  </div>
                </div>

                {/* Claim button */}
                <div className="shrink-0">
                  {quest.completed && !quest.claimed ? (
                    <button
                      onClick={() => onClaim(quest._id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-gold text-ink-950 rounded-lg hover:bg-amber-400 transition-colors"
                    >
                      +{quest.xpReward} XP
                    </button>
                  ) : quest.claimed ? (
                    <span className="text-xs text-emerald-400 font-medium">{t.daily.claimed}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
