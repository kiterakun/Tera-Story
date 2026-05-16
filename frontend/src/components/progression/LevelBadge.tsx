import type { FC } from 'react';
import { useTranslation } from '../../i18n';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<string, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
};

const levelColors = (level: number): string => {
  if (level >= 50) return 'bg-amber-400 text-ink-950 ring-2 ring-amber-300';
  if (level >= 30) return 'bg-purple-500 text-white';
  if (level >= 20) return 'bg-blue-500 text-white';
  if (level >= 10) return 'bg-emerald-500 text-white';
  return 'bg-ink-600 text-ink-200';
};

export const LevelBadge: FC<LevelBadgeProps> = ({ level, size = 'md' }) => {
  const t = useTranslation();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClasses[size]} ${levelColors(level)}`}
      title={t.common.level.replace('{count}', String(level))}
    >
      {level}
    </span>
  );
};
