import type { FC } from 'react';
import { LevelBadge } from './LevelBadge';
import { XPBar } from './XPBar';
import { useProgression } from '../../hooks/useProgression';
import { useTranslation } from '../../i18n';
import { Swords, BookOpen, MousePointerClick, Trophy, Flag } from 'lucide-react';

export const ProgressPanel: FC = () => {
  const { progress, isLoading, error } = useProgression();
  const t = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-ink-800 rounded-lg" />
        <div className="h-4 bg-ink-800 rounded w-3/4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-ink-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="text-center py-8 text-ink-400">
        <p>{error ?? t.progression.noProgressionData}</p>
      </div>
    );
  }

  const stats = [
    { icon: BookOpen, label: t.progression?.scenesCompleted ?? 'Scenes', value: progress.totalScenesCompleted },
    { icon: MousePointerClick, label: t.progression?.choicesMade ?? 'Choices', value: progress.totalChoicesMade },
    { icon: Swords, label: t.progression?.combatWon ?? 'Combat Wins', value: progress.totalCombatWon },
    { icon: Trophy, label: t.progression?.achievements ?? 'Achievements', value: progress.totalAchievementsUnlocked },
    { icon: Flag, label: t.progression?.playthroughs ?? 'Playthroughs', value: progress.totalPlaythroughsCompleted },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <LevelBadge level={progress.level} size="lg" />
        <div>
          <p className="text-lg font-semibold text-ink-100">{progress.levelTitle}</p>
          <p className="text-sm text-ink-400">{t.common.level.replace('{count}', String(progress.level))}</p>
        </div>
      </div>

      <XPBar currentXp={progress.xpProgress} xpToNextLevel={100} animated />

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-ink-800/50 rounded-lg p-3 flex items-center gap-2">
            <stat.icon className="w-4 h-4 text-gold-400 shrink-0" />
            <div>
              <p className="text-lg font-bold text-ink-100">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-ink-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {progress.recentXpHistory.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wide">
            {t.progression?.recentActivity ?? 'Recent Activity'}
          </p>
          <div className="space-y-1">
            {progress.recentXpHistory.map((entry, i) => (
              <div key={i} className="flex justify-between text-xs text-ink-300">
                <span>+{entry.amount} XP — {entry.source}</span>
                <span className="text-ink-500">{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
