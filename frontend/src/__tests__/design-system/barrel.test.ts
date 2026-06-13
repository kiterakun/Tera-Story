import { describe, expect, it } from 'vitest';
import {
  cn,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Spinner,
  Badge,
  RARITY_STYLES,
  CHARACTER_STATUS_STYLES,
  ITEM_STATUS_STYLES,
  SPECIAL_STATUS_STYLES,
  ROLE,
  getRarityStyle,
  getCharacterStatusStyle,
  rarityText,
  rarityBorder,
  rarityTextBorder,
  rarityBorderBg,
  rarityGlow,
  DURATION,
  EASING,
  motionClass,
  motionProps,
  transitionStyle,
  prefersReducedMotion,
  TERRAIN_COLORS,
  getTerrainColor,
} from '../../design-system';

describe('design-system barrel export', () => {
  it('exports cn utility', () => {
    expect(typeof cn).toBe('function');
    expect(cn('foo', 'bar')).toContain('foo');
    expect(cn('foo', 'bar')).toContain('bar');
  });

  it('exports all UI primitive components', () => {
    expect(typeof Button).toBe('object'); // forwardRef returns object
    expect(typeof Card).toBe('object');
    expect(typeof CardHeader).toBe('function');
    expect(typeof CardBody).toBe('function');
    expect(typeof CardFooter).toBe('function');
    expect(typeof Input).toBe('object');
    expect(typeof Textarea).toBe('object');
    expect(typeof Spinner).toBe('function');
    expect(typeof Badge).toBe('object');
  });

  it('exports all color maps', () => {
    expect(RARITY_STYLES).toBeDefined();
    expect(RARITY_STYLES.common).toBeDefined();
    expect(RARITY_STYLES.legendary).toBeDefined();
    expect(CHARACTER_STATUS_STYLES).toBeDefined();
    expect(CHARACTER_STATUS_STYLES.active).toBeDefined();
    expect(CHARACTER_STATUS_STYLES.dead).toBeDefined();
    expect(ITEM_STATUS_STYLES).toBeDefined();
    expect(SPECIAL_STATUS_STYLES).toBeDefined();
    expect(ROLE).toBeDefined();
    expect(ROLE.danger).toBeDefined();
    expect(ROLE.success).toBeDefined();
  });

  it('exports color helpers', () => {
    expect(typeof getRarityStyle).toBe('function');
    expect(typeof getCharacterStatusStyle).toBe('function');
    expect(typeof rarityText).toBe('function');
    expect(typeof rarityBorder).toBe('function');
    expect(typeof rarityTextBorder).toBe('function');
    expect(typeof rarityBorderBg).toBe('function');
    expect(typeof rarityGlow).toBe('function');
    expect(getRarityStyle('legendary').text).toBe('text-amber-400');
    expect(getRarityStyle('not-real').text).toBe(RARITY_STYLES.common.text);
  });

  it('exports motion constants + helpers', () => {
    expect(DURATION.fast).toBe(120);
    expect(EASING.linear).toBe('linear');
    expect(typeof motionClass).toBe('function');
    expect(typeof motionProps).toBe('function');
    expect(typeof transitionStyle).toBe('function');
    expect(typeof prefersReducedMotion).toBe('function');
    expect(motionClass('fade-in')).toBe('animate-fade-in');
  });

  it('exports terrain colors', () => {
    expect(TERRAIN_COLORS).toBeDefined();
    expect(TERRAIN_COLORS.forest).toBe('#22c55e');
    expect(getTerrainColor('forest')).toBe('#22c55e');
    expect(getTerrainColor(null)).toBe(TERRAIN_COLORS.default);
    expect(getTerrainColor('not-a-terrain')).toBe(TERRAIN_COLORS.default);
  });
});
