/**
 * Motion — runtime constants and helpers for the design-system.
 *
 * Why a TS module in addition to the CSS variables?
 * - Components sometimes need to compute durations at render time
 *   (e.g. progress bars, sequence animations).
 * - Storybook-lite docs page needs to enumerate motion tokens.
 * - Tests assert token values match CSS to prevent drift.
 *
 * The CSS variables in index.css are the runtime source of truth;
 * these constants mirror them. Keep in sync via tests.
 */

import { cn } from './cn';

/** Duration tokens — mirror --duration-* CSS variables. */
export const DURATION = {
  fast:   120,
  base:   200,
  slow:   320,
  slower: 500,
  /** Special-purpose: page transitions */
  pageTransition: 320,
  /** Special-purpose: daily check-in fly-up */
  flyUp: 1500,
  /** Special-purpose: pulse-glow */
  pulse: 2000,
} as const;

export type DurationToken = keyof typeof DURATION;

/** Easing tokens — mirror --ease-* CSS variables. */
export const EASING = {
  linear:      'linear',
  standard:    'cubic-bezier(0.2, 0, 0, 1)',
  decelerate:  'cubic-bezier(0, 0, 0, 1)',
  accelerate:  'cubic-bezier(0.3, 0, 1, 1)',
  spring:      'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type EasingToken = keyof typeof EASING;

/** Named animations — mirror keyframes in tailwind.config.ts. */
export type MotionVariant =
  | 'fade-in'
  | 'fade-out'
  | 'scale-in'
  | 'slide-in-right'
  | 'fly-up'
  | 'pulse-glow';

/**
 * Returns Tailwind animation class for a given motion variant.
 * Reads from the `animation` namespace in tailwind.config.ts
 * (e.g. `animate-fade-in`, `animate-scale-in`).
 */
export function motionClass(variant: MotionVariant): string {
  return `animate-${variant}`;
}

/**
 * Compose motion into a className string. Pass either a single
 * variant, an array, or undefined. Returns an empty string if no
 * motion is requested.
 *
 * @example
 *   <div className={cn('bg-ink-800', motionProps('fade-in'))} />
 */
export function motionProps(variant: MotionVariant | MotionVariant[] | undefined): string {
  if (!variant) return '';
  if (Array.isArray(variant)) return cn(...variant.map(motionClass));
  return motionClass(variant);
}

/**
 * Returns a CSS transition string using motion tokens. Useful for
 * components that need inline transition styles (e.g. dynamic
 * progress indicators).
 */
export function transitionStyle(
  property: string = 'all',
  duration: DurationToken = 'base',
  easing: EasingToken = 'standard',
): string {
  return `${property} ${DURATION[duration]}ms ${EASING[easing]}`;
}

/**
 * Check whether the user prefers reduced motion. SSR-safe.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
