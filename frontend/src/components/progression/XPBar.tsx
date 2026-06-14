import type { FC } from 'react';
import { prefersReducedMotion } from '../../design-system/motion';

interface XPBarProps {
  currentXp: number;
  xpToNextLevel: number;
  animated?: boolean;
  ariaLabel?: string;
}

export const XPBar: FC<XPBarProps> = ({
  currentXp,
  xpToNextLevel,
  animated = false,
  ariaLabel,
}) => {
  const pct = xpToNextLevel > 0 ? Math.min(100, Math.max(0, Math.round((currentXp / xpToNextLevel) * 100))) : 100;
  const transitionClass = animated && !prefersReducedMotion() ? motionClass : '';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-ink-400 mb-1">
        <span>{currentXp} XP</span>
        <span>{xpToNextLevel} XP</span>
      </div>
      <div
        className="h-2 bg-ink-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? `${pct}% of XP to next level`}
      >
        <div
          className={`h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full ${transitionClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-ink-500 mt-1 text-right">{pct}%</div>
    </div>
  );
};

const motionClass = 'transition-[width] duration-base ease-standard';
