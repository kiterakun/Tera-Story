/**
 * Spinner — single loading visual for the whole app.
 *
 * Replaces 4 fragmented loading styles:
 * 1. Raw `<div className="animate-spin rounded-full border-b-2 border-..." />`
 * 2. SVG with `<circle ... className="animate-spin" />`
 * 3. Loader2 lucide-react icon with `animate-spin`
 * 4. `animate-[flyUp_1.5s_ease-out]` decorative animations (special-cased)
 *
 * Sizes: sm (w-3.5 h-3.5) | md (w-4 h-4) | lg (w-5 h-5)
 * Variants: 'spin' (default Loader2) | 'pulse' (skeleton-friendly dot)
 *
 * Reduced motion: the global CSS rule in index.css shortens all
 * `animate-*` classes to 0.01ms when prefers-reduced-motion is set,
 * so all spinners become visually static without code branching.
 */

import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerVariant = 'spin' | 'pulse';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  /** Override color via Tailwind text class. Defaults to currentColor. */
  className?: string;
  /** Accessible label. Empty string hides the role="status". */
  label?: string;
}

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function Spinner({
  size = 'md',
  variant = 'spin',
  className,
  label = 'Loading',
}: SpinnerProps) {
  const sizeCls = SIZE_CLASS[size];
  const role = label ? 'status' : undefined;
  const ariaLabel = label || undefined;

  if (variant === 'pulse') {
    return (
      <span
        role={role}
        aria-label={ariaLabel}
        className={cn(
          'inline-block rounded-full bg-current shrink-0 animate-pulse',
          sizeCls,
          className,
        )}
      />
    );
  }

  return (
    <Loader2
      role={role}
      aria-label={ariaLabel}
      className={cn('animate-spin shrink-0', sizeCls, className)}
    />
  );
}
