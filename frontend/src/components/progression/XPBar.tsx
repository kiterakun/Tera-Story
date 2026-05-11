import type { FC } from 'react';

interface XPBarProps {
  currentXp: number;
  xpToNextLevel: number;
  animated?: boolean;
}

export const XPBar: FC<XPBarProps> = ({ currentXp, xpToNextLevel, animated = false }) => {
  const pct = xpToNextLevel > 0 ? Math.min(100, Math.round((currentXp / xpToNextLevel) * 100)) : 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-ink-400 mb-1">
        <span>{currentXp} XP</span>
        <span>{xpToNextLevel} XP</span>
      </div>
      <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-gold to-amber-400 rounded-full ${animated ? 'transition-[width] duration-500 ease-out' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-ink-500 mt-1 text-right">{pct}%</div>
    </div>
  );
};
