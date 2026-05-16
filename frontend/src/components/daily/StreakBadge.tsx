import type { FC } from 'react';
import { Flame } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-1.5 py-0.5 gap-0.5',
  md: 'text-sm px-2 py-1 gap-1',
};

const iconSizes: Record<string, number> = {
  sm: 12,
  md: 14,
};

function streakColor(streak: number): string {
  if (streak >= 90) return 'bg-purple-600 text-purple-100 ring-2 ring-purple-400/50 shadow-[0_0_8px_rgba(168,85,247,0.4)]';
  if (streak >= 30) return 'bg-red-600 text-red-100';
  if (streak >= 7) return 'bg-orange-600 text-orange-100';
  return 'bg-ink-700 text-ink-300';
}

export const StreakBadge: FC<StreakBadgeProps> = ({ streak, size = 'md' }) => {
  const t = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]} ${streakColor(streak)}`}
      title={t.daily.streakTitle.replace('{count}', String(streak))}
    >
      <Flame className="shrink-0" size={iconSizes[size]} />
      {streak}
    </span>
  );
};
