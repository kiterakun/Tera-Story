/**
 * Badge — compact label primitive.
 *
 * Two variants:
 * - rarity:  common | uncommon | rare | epic | legendary
 * - status:  active | injured | missing | dead
 *
 * Two shapes:
 * - pill:   fully rounded (default — for tags/chips)
 * - square: small rounded corners (for inline labels)
 *
 * Always renders the canonical color from design-system/colors so
 * theme switching is automatic.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';
import { RARITY_STYLES, CHARACTER_STATUS_STYLES, type RarityStyle, type StatusStyle } from './colors';

export type BadgeVariant = 'rarity' | 'status';
export type BadgeShape = 'pill' | 'square';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  shape?: BadgeShape;
  /** Required: rarity name (common/uncommon/rare/epic/legendary) when variant=rarity */
  rarity?: keyof typeof RARITY_STYLES | string;
  /** Required: status name (active/injured/missing/dead) when variant=status */
  status?: keyof typeof CHARACTER_STATUS_STYLES | string;
  /** Optional icon (lucide component) rendered before the text */
  icon?: ReactNode;
  /** Visible label; defaults to the rarity/status string */
  children?: ReactNode;
  size?: 'sm' | 'md';
}

const SIZE_CLASS: Record<'sm' | 'md', string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
};

const SHAPE_CLASS: Record<BadgeShape, string> = {
  pill: 'rounded-full',
  square: 'rounded-md',
};

function styleForVariant(variant: BadgeVariant, value: string | undefined): RarityStyle | StatusStyle | null {
  if (!value) return null;
  if (variant === 'rarity') {
    return RARITY_STYLES[value as keyof typeof RARITY_STYLES] ?? RARITY_STYLES.common;
  }
  return CHARACTER_STATUS_STYLES[value as keyof typeof CHARACTER_STATUS_STYLES] ?? CHARACTER_STATUS_STYLES.missing;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = 'rarity',
    shape = 'pill',
    rarity,
    status,
    icon,
    children,
    size = 'sm',
    className,
    ...rest
  },
  ref,
) {
  const value = variant === 'rarity' ? rarity : status;
  const style = styleForVariant(variant, value);
  if (!style) return null;

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 font-semibold uppercase tracking-wider whitespace-nowrap',
        SIZE_CLASS[size],
        SHAPE_CLASS[shape],
        style.text,
        style.bg,
        className,
      )}
      {...rest}
    >
      {icon}
      {children ?? (value as string)}
    </span>
  );
});
