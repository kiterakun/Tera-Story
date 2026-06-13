/**
 * Card — surface container primitive.
 *
 * Variants:
 * - panel:     flat surface for static content
 * - interactive: hover/focus affordance, renders as <button> when onClick
 * - elevated:  lifted with shadow for modal-like contexts
 *
 * Slots: CardHeader, CardBody, CardFooter for consistent layout.
 * Replaces 20+ duplicate card wrapper patterns across the codebase.
 */

import { forwardRef, type HTMLAttributes, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export type CardVariant = 'panel' | 'interactive' | 'elevated';

const BASE =
  'block rounded-2xl bg-ink-800 border border-ink-700 ' +
  'transition-all duration-base ease-standard';

const VARIANT_CLASS: Record<CardVariant, string> = {
  panel:
    'shadow-sm',
  interactive:
    'cursor-pointer hover:border-ink-600 hover:shadow-md hover:-translate-y-0.5 ' +
    'active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
  elevated:
    'shadow-lg border-ink-600',
};

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  variant?: CardVariant;
  /** When provided, renders the card as a button (interactive behavior) */
  onClick?: () => void;
  /** Disabled state for interactive cards */
  disabled?: boolean;
  /** Aria label for interactive cards when content doesn't provide one */
  'aria-label'?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Polymorphic Card:
 * - If `onClick` is provided AND the card is interactive variant, renders <button>.
 * - Otherwise renders a <div>.
 */
export const Card = forwardRef<HTMLDivElement | HTMLButtonElement, CardProps>(
  function Card(
    {
      variant = 'panel',
      onClick,
      disabled,
      className,
      children,
      type,
      ...rest
    },
    ref,
  ) {
    const classes = cn(BASE, VARIANT_CLASS[variant], disabled && 'opacity-50 pointer-events-none', className);

    const isButton = variant === 'interactive' && onClick;

    if (isButton) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type={type ?? 'button'}
          onClick={onClick}
          disabled={disabled}
          aria-label={rest['aria-label']}
          className={cn(classes, 'text-left w-full')}
          {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      );
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        onClick={onClick}
        className={classes}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

// ============================================================
// Slots
// ============================================================

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-card-lg py-card border-b border-ink-700', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-card-lg py-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-card-lg py-card border-t border-ink-700', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
