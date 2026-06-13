/**
 * Verifies the prefers-reduced-motion CSS guard in index.css.
 *
 * The guard sets:
 * - animation-duration: 0.01ms !important
 * - animation-iteration-count: 1 !important
 * - transition-duration: 0.01ms !important
 * - scroll-behavior: auto !important
 *
 * All `*`, `*::before`, `*::after` selectors are affected.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('prefers-reduced-motion CSS guard', () => {
  const css = readFileSync(resolve(__dirname, '../../../src/index.css'), 'utf-8');

  it('declares @media (prefers-reduced-motion: reduce) rule', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('applies to universal selector with ::before and ::after', () => {
    // Find the reduced-motion block and check its selectors
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    const block = match![1];
    expect(block).toMatch(/^\s*\*,/m);
    expect(block).toMatch(/\*::before/);
    expect(block).toMatch(/\*::after/);
  });

  it('sets animation-duration to near-zero (0.01ms)', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/animation-duration:\s*0\.01ms/);
  });

  it('sets transition-duration to near-zero (0.01ms)', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/transition-duration:\s*0\.01ms/);
  });

  it('sets animation-iteration-count to 1', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/animation-iteration-count:\s*1/);
  });

  it('sets scroll-behavior to auto (overrides smooth scroll)', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/scroll-behavior:\s*auto/);
  });

  it('uses !important to override any animation/transition', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    const block = match![1];
    // All four rules should have !important
    expect(block).toMatch(/animation-duration:[^;]*!important/);
    expect(block).toMatch(/animation-iteration-count:[^;]*!important/);
    expect(block).toMatch(/transition-duration:[^;]*!important/);
    expect(block).toMatch(/scroll-behavior:[^;]*!important/);
  });
});

describe('prefersReducedMotion hook (design-system/motion.ts)', () => {
  it('exports prefersReducedMotion function', async () => {
    const mod = await import('../../design-system/motion');
    expect(typeof mod.prefersReducedMotion).toBe('function');
  });

  it('returns boolean', async () => {
    const { prefersReducedMotion } = await import('../../design-system/motion');
    expect(typeof prefersReducedMotion()).toBe('boolean');
  });
});
