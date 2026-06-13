import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  DURATION,
  EASING,
  motionClass,
  motionProps,
  transitionStyle,
  prefersReducedMotion,
} from '../../design-system/motion';

describe('Motion — constants', () => {
  it('DURATION has the expected named durations', () => {
    expect(DURATION.fast).toBe(120);
    expect(DURATION.base).toBe(200);
    expect(DURATION.slow).toBe(320);
    expect(DURATION.slower).toBe(500);
    expect(DURATION.flyUp).toBe(1500);
    expect(DURATION.pulse).toBe(2000);
  });

  it('EASING has the expected named easings', () => {
    expect(EASING.linear).toBe('linear');
    expect(EASING.standard).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(EASING.decelerate).toBe('cubic-bezier(0, 0, 0, 1)');
    expect(EASING.accelerate).toBe('cubic-bezier(0.3, 0, 1, 1)');
    expect(EASING.spring).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
  });

  it('DURATION constants match --duration-* CSS variables in index.css', () => {
    const css = readFileSync(
      resolve(__dirname, '../../../src/index.css'),
      'utf-8',
    );
    // Spot-check: --duration-base: 200ms ↔ DURATION.base === 200
    expect(css).toMatch(/--duration-base:\s*200ms/);
    expect(DURATION.base).toBe(200);
    // Spot-check: --duration-slow: 320ms ↔ DURATION.slow === 320
    expect(css).toMatch(/--duration-slow:\s*320ms/);
    expect(DURATION.slow).toBe(320);
    // Spot-check: --duration-fast: 120ms ↔ DURATION.fast === 120
    expect(css).toMatch(/--duration-fast:\s*120ms/);
    expect(DURATION.fast).toBe(120);
    // Spot-check: --duration-slower: 500ms ↔ DURATION.slower === 500
    expect(css).toMatch(/--duration-slower:\s*500ms/);
    expect(DURATION.slower).toBe(500);
  });

  it('EASING constants match --ease-* CSS variables in index.css', () => {
    const css = readFileSync(
      resolve(__dirname, '../../../src/index.css'),
      'utf-8',
    );
    expect(css).toMatch(/--ease-standard:\s*cubic-bezier\(0\.2, 0, 0, 1\)/);
    expect(css).toMatch(/--ease-decelerate:\s*cubic-bezier\(0, 0, 0, 1\)/);
    expect(css).toMatch(/--ease-accelerate:\s*cubic-bezier\(0\.3, 0, 1, 1\)/);
    expect(css).toMatch(/--ease-spring:\s*cubic-bezier\(0\.34, 1\.56, 0\.64, 1\)/);
  });
});

describe('Motion — helpers', () => {
  it('motionClass returns Tailwind animation class', () => {
    expect(motionClass('fade-in')).toBe('animate-fade-in');
    expect(motionClass('scale-in')).toBe('animate-scale-in');
    expect(motionClass('fly-up')).toBe('animate-fly-up');
    expect(motionClass('pulse-glow')).toBe('animate-pulse-glow');
    expect(motionClass('slide-in-right')).toBe('animate-slide-in-right');
    expect(motionClass('fade-out')).toBe('animate-fade-out');
  });

  it('motionProps handles single variant', () => {
    expect(motionProps('fade-in')).toBe('animate-fade-in');
  });

  it('motionProps handles array of variants', () => {
    expect(motionProps(['fade-in', 'scale-in'])).toMatch(/animate-fade-in/);
    expect(motionProps(['fade-in', 'scale-in'])).toMatch(/animate-scale-in/);
  });

  it('motionProps returns empty string for undefined', () => {
    expect(motionProps(undefined)).toBe('');
    expect(motionProps()).toBe('');
  });

  it('transitionStyle composes valid CSS transition string', () => {
    expect(transitionStyle('opacity', 'base', 'standard')).toBe(
      'opacity 200ms cubic-bezier(0.2, 0, 0, 1)',
    );
    expect(transitionStyle('transform', 'slow', 'decelerate')).toBe(
      'transform 320ms cubic-bezier(0, 0, 0, 1)',
    );
    expect(transitionStyle('all', 'fast')).toBe('all 120ms cubic-bezier(0.2, 0, 0, 1)');
    expect(transitionStyle()).toBe('all 200ms cubic-bezier(0.2, 0, 0, 1)');
  });
});

describe('Motion — prefersReducedMotion', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when prefers-reduced-motion is set', () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when prefers-reduced-motion is not set', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
    expect(prefersReducedMotion()).toBe(false);
  });
});
