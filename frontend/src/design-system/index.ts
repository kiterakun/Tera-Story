/**
 * Design System — public barrel export.
 *
 * Import design-system primitives via:
 *   import { Button, Card, Badge, Spinner, cn, motionProps } from '@/design-system';
 *   import { RARITY_STYLES, CHARACTER_STATUS_STYLES } from '@/design-system';
 *   import { DURATION, EASING, prefersReducedMotion } from '@/design-system';
 *
 * This barrel is the canonical entry point. Avoid deep imports into
 * individual files (e.g. '@/design-system/Button') so future moves
 * don't break consumers.
 */

// ============================================================
// cn utility
// ============================================================
export { cn, type ClassValue } from './cn';

// ============================================================
// Colors — rarity, status, role maps
// ============================================================
export {
  RARITY_STYLES,
  CHARACTER_STATUS_STYLES,
  ITEM_STATUS_STYLES,
  SPECIAL_STATUS_STYLES,
  ORGANIZATION_STATUS_STYLES,
  ROLE,
  getRarityStyle,
  getCharacterStatusStyle,
  getOrganizationStatusStyle,
  rarityText,
  rarityBorder,
  rarityTextBorder,
  rarityBorderBg,
  rarityGlow,
  type RarityStyle,
  type StatusStyle,
  type ItemStatusKind,
  type SpecialItemStatusKind,
  type OrganizationStatusKind,
} from './colors';

// ============================================================
// Motion — duration/easing constants + helpers
// ============================================================
export {
  DURATION,
  EASING,
  motionClass,
  motionProps,
  transitionStyle,
  prefersReducedMotion,
  type DurationToken,
  type EasingToken,
  type MotionVariant,
} from './motion';

// ============================================================
// Terrain colors (used by world map)
// ============================================================
export { TERRAIN_COLORS, getTerrainColor, type TerrainType } from './terrain';

// ============================================================
// UI primitives
// ============================================================
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';

export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  type CardProps,
  type CardVariant,
} from './Card';

export { Input, Textarea, type InputProps, type TextareaProps } from './Input';

export {
  Spinner,
  type SpinnerProps,
  type SpinnerSize,
  type SpinnerVariant,
} from './Spinner';

export { Badge, type BadgeProps, type BadgeVariant, type BadgeShape } from './Badge';

export { EntityCard, type EntityCardProps, type EntityCardVariant } from './EntityCard';

export { ItemCard, type ItemCardProps } from './ItemCard';
export { AbilityCard, type AbilityCardProps } from './AbilityCard';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  type ModalProps,
  type ModalSize,
} from './Modal';

export { createFocusTrap, type FocusTrap } from './focusTrap';

export {
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  type DrawerProps,
  type DrawerSide,
  type DrawerWidth,
} from './Drawer';
