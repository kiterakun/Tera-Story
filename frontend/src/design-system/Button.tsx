/**
 * Button — primary UI primitive.
 *
 * Variants: primary | secondary | ghost | danger | gold
 * Sizes:    sm | md | lg
 * Features: loading state, disabled, polymorphic `as` for buttons/anchors
 *
 * Replaces 17+ duplicate primary button patterns across the codebase.
 * Spec: .kite-docs/spec/design-system-spec.md (section 8)
 */

import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl ' +
  'transition-all duration-base ease-standard ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
  'select-none whitespace-nowrap';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-600 hover:bg-accent-500 text-white shadow-sm hover:shadow-glow ' +
    'active:scale-[0.98]',
  secondary:
    'bg-ink-800 hover:bg-ink-700 text-ink-100 border border-ink-700 hover:border-ink-600 ' +
    'active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-ink-800/60 text-ink-200 hover:text-ink-100 ' +
    'active:scale-[0.98]',
  danger:
    'bg-danger hover:bg-danger/90 text-white shadow-sm ' +
    'active:scale-[0.98]',
  gold:
    'bg-gold hover:bg-gold-400 text-ink-950 shadow-sm hover:shadow-gold ' +
    'active:scale-[0.98]',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm min-w-[44px]',
  lg: 'h-12 px-6 text-base min-w-[48px]',
};

export interface CommonButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Render as an anchor when an href is provided */
  href?: string;
  /** Forward className for layout overrides (color override discouraged) */
  className?: string;
  children?: ReactNode;
}

export type ButtonProps = CommonButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonButtonProps> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonButtonProps>;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      href,
      className,
      children,
      type,
      ...rest
    },
    ref,
  ) {
    const classes = cn(BASE, VARIANT_CLASS[variant], SIZE_CLASS[size], className);

    const content = (
      <>
        {loading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} className="text-current" />
        ) : (
          leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
        )}
        {children && <span className={loading ? 'opacity-0' : ''}>{children}</span>}
        {!loading && rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
      </>
    );

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={disabled || loading ? undefined : href}
          aria-disabled={disabled || loading || undefined}
          aria-busy={loading || undefined}
          className={classes}
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  },
);
