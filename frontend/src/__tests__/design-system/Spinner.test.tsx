import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../../design-system/Spinner';

describe('Spinner primitive', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
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
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders a Loader2 icon with animate-spin by default', () => {
    render(<Spinner />);
    const el = screen.getByRole('status');
    expect(el.tagName.toLowerCase()).toBe('svg');
    expect(el).toHaveClass('animate-spin');
  });

  it('exposes accessible label', () => {
    render(<Spinner label="Saving chapter" />);
    expect(screen.getByRole('status', { name: /saving chapter/i })).toBeInTheDocument();
  });

  it('hides label when label="" is passed', () => {
    render(<Spinner label="" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders all 3 sizes', () => {
    const sizes = [
      { s: 'sm', cls: 'w-3.5' },
      { s: 'md', cls: 'w-4' },
      { s: 'lg', cls: 'w-5' },
    ] as const;
    for (const { s, cls } of sizes) {
      const { unmount } = render(<Spinner size={s} />);
      expect(screen.getByRole('status')).toHaveClass(cls);
      unmount();
    }
  });

  it('pulse variant renders a non-spinning dot', () => {
    render(<Spinner variant="pulse" />);
    const el = screen.getByRole('status');
    expect(el).toHaveClass('animate-pulse');
    expect(el).not.toHaveClass('animate-spin');
  });

  it('respects custom className', () => {
    render(<Spinner className="text-accent-400" />);
    expect(screen.getByRole('status')).toHaveClass('text-accent-400');
  });

  it('reduced motion is handled by global CSS rule (animate-* still applied, duration zeroed)', () => {
    // The component always applies animate-spin/animate-pulse classes.
    // The prefers-reduced-motion override lives in index.css and shortens
    // animation-duration to 0.01ms globally — verified by visual review in
    // Phase 7, not by component-level class assertions.
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

    render(<Spinner label="Loading" />);
    // Classes are still applied; CSS rule overrides behavior at render time.
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });
});
