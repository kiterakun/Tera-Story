import { useState } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import type { AchievementWithProgress } from '../services/achievementApi';
import { Trophy, Lock, HelpCircle, Award } from 'lucide-react';

const RARITY_COLORS: Record<string, string> = {
  common: 'border-ink-500 bg-ink-800/50',
  uncommon: 'border-emerald-500 bg-emerald-500/10',
  rare: 'border-blue-500 bg-blue-500/10',
  epic: 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-400/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  exploration: 'Khám phá',
  combat: 'Chiến đấu',
  collection: 'Sưu tập',
  social: 'Xã hội',
  milestone: 'Cột mốc',
  hidden: 'Ẩn',
};

function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: AchievementWithProgress;
  onClick: () => void;
}) {
  const isHidden = achievement.hidden && !achievement.unlocked;
  const isInProgress = !achievement.unlocked && achievement.progress > 0;

  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg border-2 p-4 text-left transition-transform hover:scale-105 focus:scale-105 ${
        achievement.unlocked
          ? RARITY_COLORS[achievement.rarity]
          : 'border-ink-800 bg-ink-900/50 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        {isHidden ? (
          <HelpCircle size={28} className="text-ink-600 shrink-0" />
        ) : (
          <div className={`rounded-lg p-1.5 shrink-0 ${achievement.unlocked ? 'bg-gold/20 text-gold' : 'bg-ink-800 text-ink-600'}`}>
            <Trophy size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold ${achievement.unlocked ? 'text-gold' : 'text-ink-500'}`}>
            {isHidden ? 'Thành tựu ẩn' : achievement.name.vi}
          </h3>
          {!isHidden && (
            <p className="mt-0.5 text-xs text-narration line-clamp-2">
              {achievement.description.vi}
            </p>
          )}
          {isInProgress && achievement.unlockCriteria.threshold && (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{
                    width: `${Math.min(100, (achievement.progress / achievement.unlockCriteria.threshold) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-ink-500">
                {achievement.progress}/{achievement.unlockCriteria.threshold}
              </p>
            </div>
          )}
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="mt-1 text-[10px] text-ink-500">
              {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN')}
            </p>
          )}
          {!achievement.unlocked && !isHidden && !isInProgress && (
            <Lock size={12} className="mt-1.5 text-ink-700" />
          )}
        </div>
        {achievement.xpReward > 0 && (
          <span className="shrink-0 rounded-full bg-ink-800 px-2 py-0.5 text-[10px] font-medium text-gold">
            +{achievement.xpReward} XP
          </span>
        )}
      </div>
    </button>
  );
}

export default function AchievementsPage() {
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithProgress | null>(null);
  const [filters, setFilters] = useState<{
    category?: string;
    status?: string;
  }>({});

  const { achievements, stats, isLoading, error, refetch } = useAchievements(filters);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={refetch} className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm text-ink-950 hover:bg-gold/80">
          Thử lại
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-ink-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-ink-800" />
          ))}
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Award size={48} className="text-ink-600" />
        <p className="mt-4 text-lg text-narration">Chưa có thành tựu nào.</p>
        <p className="mt-1 text-sm text-ink-500">Hoàn thành một cảnh truyện để bắt đầu!</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Stats header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gold">Thành Tựu</h1>
        {stats && (
          <p className="mt-1 text-sm text-narration">
            {stats.unlocked}/{stats.total} đã mở khóa — {stats.percentComplete}% hoàn thành
          </p>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(['all', 'exploration', 'combat', 'collection', 'milestone', 'social', 'hidden'] as const).map(
          (cat) => (
            <button
              key={cat}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  category: cat === 'all' ? undefined : cat,
                }))
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (cat === 'all' && !filters.category) || filters.category === cat
                  ? 'bg-gold text-ink-950'
                  : 'bg-ink-800 text-ink-400 hover:bg-ink-700'
              }`}
            >
              {cat === 'all' ? 'Tất cả' : CATEGORY_LABELS[cat]}
            </button>
          )
        )}
        <select
          value={filters.status || 'all'}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value === 'all' ? undefined : e.target.value,
            }))
          }
          className="ml-auto rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm text-ink-300"
        >
          <option value="all">Tất cả</option>
          <option value="unlocked">Đã mở khóa</option>
          <option value="locked">Chưa mở</option>
          <option value="in_progress">Đang tiến hành</option>
        </select>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {achievements.map((ach) => (
          <AchievementCard
            key={ach.key}
            achievement={ach}
            onClick={() => setSelectedAchievement(ach)}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-4">
              <div className={`rounded-xl p-3 ${selectedAchievement.unlocked ? 'bg-gold/20 text-gold' : 'bg-ink-800 text-ink-600'}`}>
                <Trophy size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gold">{selectedAchievement.name.vi}</h2>
                <p className="text-sm text-narration">{selectedAchievement.description.vi}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-400">
              <span>{CATEGORY_LABELS[selectedAchievement.category]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${RARITY_COLORS[selectedAchievement.rarity]}`}>
                {selectedAchievement.rarity}
              </span>
              <span className="text-gold">+{selectedAchievement.xpReward} XP</span>
            </div>
            {selectedAchievement.unlocked && selectedAchievement.unlockedAt && (
              <p className="mt-4 text-xs text-ink-500">
                Mở khóa: {new Date(selectedAchievement.unlockedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
            <button
              onClick={() => setSelectedAchievement(null)}
              className="mt-6 w-full rounded-lg border border-ink-700 py-2 text-sm text-ink-300 hover:bg-ink-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
