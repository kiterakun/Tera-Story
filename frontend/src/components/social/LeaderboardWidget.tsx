import { useEffect } from 'react';
import type { FC } from 'react';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import type { LeaderboardType, LeaderboardScope, LeaderboardPeriod } from '../../services/leaderboardApi';
import { Trophy, Medal, Users, Globe } from 'lucide-react';
import { useTranslation } from '../../i18n';

const TYPE_OPTIONS: { value: LeaderboardType; labelKey: string }[] = [
  { value: 'scenes', labelKey: 'scenes' },
  { value: 'achievements', labelKey: 'achievements' },
  { value: 'streak', labelKey: 'streak' },
  { value: 'cards', labelKey: 'cards' },
];

const TOP_COLORS: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
};

export const LeaderboardWidget: FC = () => {
  const {
    entries,
    myRank,
    type,
    scope,
    period,
    isLoading,
    error,
    fetchLeaderboard,
  } = useLeaderboard();
  const t = useTranslation();

  useEffect(() => {
    fetchLeaderboard(type, scope, period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTypeChange = (t: LeaderboardType) => {
    fetchLeaderboard(t, scope, period);
  };

  const handleScopeToggle = () => {
    const newScope: LeaderboardScope = scope === 'friends' ? 'global' : 'friends';
    fetchLeaderboard(type, newScope, period);
  };

  const handlePeriodToggle = () => {
    const newPeriod: LeaderboardPeriod = period === 'this_week' ? 'all_time' : 'this_week';
    fetchLeaderboard(type, scope, newPeriod);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-6 w-6 rounded bg-ink-700" />
              <div className="h-8 w-8 rounded-full bg-ink-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-ink-700" />
                <div className="h-2 w-16 rounded bg-ink-700" />
              </div>
              <div className="h-4 w-10 rounded bg-ink-700" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => fetchLeaderboard(type, scope, period)}
            className="mt-3 rounded-lg bg-ink-800 px-4 py-1.5 text-xs text-ink-300 hover:bg-ink-700 transition-colors"
          >
            {t.common.retry}
          </button>
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users size={32} className="text-ink-600 mb-2" />
          <p className="text-sm text-ink-400">
            {scope === 'friends'
              ? t.leaderboard.addFriendsPrompt
              : t.leaderboard.noData}
          </p>
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        {entries.map((entry) => {
          const isMe = entry.rank === myRank;
          const initial = entry.displayName.charAt(0).toUpperCase();

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-4 py-2.5 border-b border-ink-700/50 last:border-b-0 transition-colors ${
                isMe ? 'bg-gold/10' : 'hover:bg-ink-800/50'
              }`}
            >
              {/* Rank */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {entry.rank <= 3 ? (
                  <Medal size={18} className={TOP_COLORS[entry.rank]} />
                ) : (
                  <span className="text-xs font-bold text-ink-500">{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-ink-300">
                {entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isMe ? 'text-gold' : 'text-ink-200'}`}>
                  {entry.displayName}
                </p>
                <p className="text-xs text-ink-500">Lv.{entry.level}</p>
              </div>

              {/* Value */}
              <span className={`shrink-0 text-sm font-semibold ${isMe ? 'text-gold' : 'text-ink-300'}`}>
                {entry.value.toLocaleString('vi-VN')}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-ink-700">
        <Trophy size={18} className="text-gold shrink-0" />
        <h3 className="text-sm font-bold text-ink-100">{t.leaderboard.title}</h3>
      </div>

      {/* Type tabs */}
      <div className="flex gap-0.5 px-3 py-2 overflow-x-auto">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleTypeChange(opt.value)}
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              type === opt.value
                ? 'bg-gold/20 text-gold'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {t.leaderboard.types[opt.labelKey as keyof typeof t.leaderboard.types]}
          </button>
        ))}
      </div>

      {/* Scope + Period toggles */}
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          onClick={handleScopeToggle}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            scope === 'friends'
              ? 'bg-ink-800 text-ink-200'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          {scope === 'friends' ? <Users size={12} /> : <Globe size={12} />}
          {scope === 'friends' ? t.leaderboard.friends : t.leaderboard.global}
        </button>
        <button
          onClick={handlePeriodToggle}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            period === 'this_week'
              ? 'bg-ink-800 text-ink-200'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          {period === 'this_week' ? t.leaderboard.thisWeek : t.leaderboard.allTime}
        </button>
      </div>

      {/* Content */}
      {renderContent()}

      {/* My rank footer */}
      {myRank > 0 && entries.length > 0 && (
        <div className="border-t border-ink-700 px-4 py-2.5 flex items-center gap-3">
          <Trophy size={14} className="text-gold shrink-0" />
          <span className="text-xs text-ink-400">
            {t.leaderboard.myRank.replace('{rank}', `<span class="font-bold text-gold">#${myRank}</span>`)}
          </span>
        </div>
      )}
    </div>
  );
};
