/**
 * Canonical color maps — single source of truth for rarity + status + role
 * semantic styles. Components import from here instead of redefining inline.
 *
 * Spec: .kite-docs/spec/design-system-spec.md (sections 2.5, 11)
 */

import type { ItemRarity, CharacterStatus } from '../services/playthroughApi';

// ============================================================
// Rarity
// ============================================================

export interface RarityStyle {
  /** Text color class */
  text: string;
  /** Background fill class */
  bg: string;
  /** Border color class */
  border: string;
  /** Optional shadow/glow class (drop-shadow or box-shadow) */
  glow: string;
  /** Glyph icon for compact chips */
  icon: string;
}

export const RARITY_STYLES: Record<ItemRarity, RarityStyle> = {
  common: {
    text: 'text-gray-300',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/40',
    glow: '',
    icon: '○',
  },
  uncommon: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    glow: '',
    icon: '◇',
  },
  rare: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]',
    icon: '◆',
  },
  epic: {
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_20px_rgba(192,132,252,0.2)]',
    icon: '★',
  },
  legendary: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.25)]',
    icon: '✦',
  },
};

/** Get the full style record for a rarity (with safe fallback to common). */
export function getRarityStyle(rarity: string | undefined | null): RarityStyle {
  if (!rarity) return RARITY_STYLES.common;
  return RARITY_STYLES[rarity as ItemRarity] ?? RARITY_STYLES.common;
}

/** Combined "text + border" class — used by compact chips (GamePanel, RPGPanel). */
export function rarityTextBorder(rarity: string): string {
  const r = getRarityStyle(rarity);
  return `${r.text} ${r.border}`;
}

/** Combined "border + bg" class — used by cards (AchievementsPage, GalleryPage). */
export function rarityBorderBg(rarity: string): string {
  const r = getRarityStyle(rarity);
  return `${r.border} ${r.bg}`;
}

/** Just the text color class — used by inline labels. */
export function rarityText(rarity: string): string {
  return getRarityStyle(rarity).text;
}

/** Just the border color class. */
export function rarityBorder(rarity: string): string {
  return getRarityStyle(rarity).border;
}

/** Just the glow/shadow class — empty string if rarity has no glow. */
export function rarityGlow(rarity: string): string {
  return getRarityStyle(rarity).glow;
}

// ============================================================
// Character status
// ============================================================

export interface StatusStyle {
  text: string;
  bg: string;
}

export const CHARACTER_STATUS_STYLES: Record<CharacterStatus, StatusStyle> = {
  active:   { text: 'text-green-400', bg: 'bg-green-500/10' },
  injured:  { text: 'text-amber-400', bg: 'bg-amber-500/10' },
  missing:  { text: 'text-gray-400',  bg: 'bg-gray-500/10' },
  dead:     { text: 'text-red-400',   bg: 'bg-red-500/10' },
};

export function getCharacterStatusStyle(status: string | undefined | null): StatusStyle {
  if (!status) return CHARACTER_STATUS_STYLES.missing;
  return CHARACTER_STATUS_STYLES[status as CharacterStatus] ?? CHARACTER_STATUS_STYLES.missing;
}

// ============================================================
// Item / SpecialItem status (variant with overlapping names)
// ============================================================

export type ItemStatusKind = 'active' | 'destroyed' | 'lost' | 'consumed';
export type SpecialItemStatusKind = 'active' | 'sealed' | 'lost' | 'consumed';

export const ITEM_STATUS_STYLES: Record<ItemStatusKind, StatusStyle> = {
  active:    { text: 'text-green-400', bg: 'bg-green-500/10' },
  destroyed: { text: 'text-red-400',   bg: 'bg-red-500/10' },
  lost:      { text: 'text-gray-400',  bg: 'bg-gray-500/10' },
  consumed:  { text: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export const SPECIAL_STATUS_STYLES: Record<SpecialItemStatusKind, StatusStyle> = {
  active:   { text: 'text-green-400', bg: 'bg-green-500/10' },
  sealed:   { text: 'text-red-400',   bg: 'bg-red-500/10' },
  lost:     { text: 'text-gray-400',  bg: 'bg-gray-500/10' },
  consumed: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
};

// ============================================================
// Organization status (active / disbanded / hidden)
// ============================================================

export type OrganizationStatusKind = 'active' | 'disbanded' | 'hidden';

export const ORGANIZATION_STATUS_STYLES: Record<OrganizationStatusKind, StatusStyle> = {
  active:    { text: 'text-green-400', bg: 'bg-green-500/10' },
  disbanded: { text: 'text-red-400',   bg: 'bg-red-500/10' },
  hidden:    { text: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export function getOrganizationStatusStyle(status: string | undefined | null): StatusStyle {
  if (!status) return ORGANIZATION_STATUS_STYLES.hidden;
  return ORGANIZATION_STATUS_STYLES[status as OrganizationStatusKind] ?? ORGANIZATION_STATUS_STYLES.hidden;
}

// ============================================================
// Role palette (danger / success / info / warning)
// These mirror the --danger/--success/--info/--warning CSS tokens
// but are exposed as Tailwind class strings for use in className={}.
// ============================================================

export const ROLE = {
  danger:  { text: 'text-danger',  bg: 'bg-danger/10',  border: 'border-danger/30' },
  success: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  info:    { text: 'text-info',    bg: 'bg-info/10',    border: 'border-info/30' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
} as const;
