import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Landmark, Package, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from './cn';
import {
  getCharacterStatusStyle,
  getOrganizationStatusStyle,
  ITEM_STATUS_STYLES,
  SPECIAL_STATUS_STYLES,
  type ItemStatusKind,
  type SpecialItemStatusKind,
} from './colors';

export type EntityCardVariant = 'character' | 'item' | 'special-item' | 'organization';

export interface EntityCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant: EntityCardVariant;
  name: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  rarity?: string;
  status?: string;
  selected?: boolean;
  icon?: LucideIcon;
  meta?: ReactNode;
  children?: ReactNode;
}

const VARIANT_ICON: Record<EntityCardVariant, LucideIcon> = {
  character: UserRound,
  item: Package,
  'special-item': Sparkles,
  organization: Landmark,
};

function getStatusClasses(variant: EntityCardVariant, status: string | undefined): string {
  if (!status) return 'text-ink-200/60 bg-ink-800';
  if (variant === 'character') {
    const style = getCharacterStatusStyle(status);
    return `${style.text} ${style.bg}`;
  }
  if (variant === 'item') {
    const style = ITEM_STATUS_STYLES[status as ItemStatusKind] ?? ITEM_STATUS_STYLES.lost;
    return `${style.text} ${style.bg}`;
  }
  if (variant === 'special-item') {
    const style = SPECIAL_STATUS_STYLES[status as SpecialItemStatusKind] ?? SPECIAL_STATUS_STYLES.lost;
    return `${style.text} ${style.bg}`;
  }
  const style = getOrganizationStatusStyle(status);
  return `${style.text} ${style.bg}`;
}

export const EntityCard = forwardRef<HTMLButtonElement, EntityCardProps>(function EntityCard(
  {
    variant,
    name,
    subtitle,
    description,
    imageUrl,
    imageAlt,
    rarity,
    status,
    selected = false,
    disabled = false,
    icon: IconOverride,
    meta,
    children,
    className,
    type = 'button',
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const Icon = IconOverride ?? VARIANT_ICON[variant];
  const statusClasses = getStatusClasses(variant, status);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-pressed={selected || undefined}
      aria-label={ariaLabel ?? `${name}${subtitle ? `, ${subtitle}` : ''}`}
      className={cn(
        'group flex min-h-[88px] w-full items-start gap-3 rounded-2xl border p-3 text-left',
        'bg-ink-950/50 border-ink-700/50 transition-all duration-base ease-standard',
        'hover:bg-ink-900/70 hover:border-accent-400/30 hover:-translate-y-0.5',
        'active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
        selected && 'border-accent-500 bg-accent-500/10',
        disabled && 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:border-ink-700/50',
        className,
      )}
      {...rest}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt ?? name} className="h-full w-full object-cover" />
        ) : (
          <Icon size={20} className="text-ink-400 transition-colors group-hover:text-accent-300" aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate font-display text-sm text-ink-100">{name}</span>
            {subtitle && <span className="block truncate text-xs text-ink-200/50">{subtitle}</span>}
          </span>
          <span className="flex shrink-0 flex-wrap justify-end gap-1">
            {rarity && <Badge variant="rarity" rarity={rarity} shape="square" />}
            {status && (
              <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider', statusClasses)}>
                {status}
              </span>
            )}
          </span>
        </span>

        {description && <span className="block line-clamp-2 text-xs text-ink-200/60">{description}</span>}
        {meta && <span className="block text-xs text-ink-200/40">{meta}</span>}
        {children}
      </span>
    </button>
  );
});
