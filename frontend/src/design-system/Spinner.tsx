/**
 * Spinner — single loading visual.
 *
 * Phase 1 step 9 will expand this with size variants + reduced-motion
 * overrides; for now it renders a token-styled Loader2 icon used by
 * Button's `loading` state. The contract is fixed: callers render
 * `<Spinner size="sm|md|lg" />` and get a consistent visual.
 */

import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Optional className for color override (defaults to current text color) */
  className?: string;
  /** Accessible label (default: "Loading") */
  label?: string;
}

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn('animate-spin shrink-0', SIZE_CLASS[size], className)}
    />
  );
}
