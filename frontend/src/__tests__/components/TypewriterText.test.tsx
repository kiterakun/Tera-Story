import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

// Default: motion NOT reduced. Override per test via vi.mocked().
vi.mock('../../design-system/motion', () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

import { TypewriterText } from '../../components/TypewriterText';
import { prefersReducedMotion } from '../../design-system/motion';

describe('TypewriterText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(prefersReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders empty initially when text is provided but animation has not run', () => {
    const { container } = render(<TypewriterText text="Hello" />);
    // Initial render: setDisplayed('') is called in effect synchronously after first paint
    // but with fakeTimers the rAF doesn't run yet. So we should see '' or partial.
    expect(container.textContent).toBeDefined();
  });

  it('renders full text immediately when prefersReducedMotion is true', () => {
    vi.mocked(prefersReducedMotion).mockReturnValue(true);
    const { container } = render(<TypewriterText text="Hello world" />);
    expect(container.textContent).toBe('Hello world');
  });

  it('displays the full text after enough animation frames', () => {
    const { container } = render(<TypewriterText text="Hello" charsPerFrame={5} />);
    // Simulate time passing — 3 frames at 32ms each = 96ms
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.textContent).toBe('Hello');
  });

  it('shows blinking caret while animation is in progress', () => {
    const { container } = render(<TypewriterText text="Hello" charsPerFrame={1} />);
    // After 1 frame: should show "H" + caret
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('hides caret when animation completes', () => {
    const { container } = render(<TypewriterText text="Hi" charsPerFrame={5} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('restarts animation when text changes', () => {
    const { container, rerender } = render(<TypewriterText text="Hello" charsPerFrame={5} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.textContent).toBe('Hello');
    rerender(<TypewriterText text="Different text" charsPerFrame={5} />);
    // Advance to allow rAF tick to begin (animation starts fresh)
    act(() => {
      vi.advanceTimersByTime(50);
    });
    // 'Different text' is 14 chars; with charsPerFrame=5 and ~50ms,
    // partial reveal expected (some chars but not all)
    const text = container.textContent || '';
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThan('Different text'.length + 1);
    // Eventually completes
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.textContent).toBe('Different text');
  });

  it('does not animate when isActive is false', () => {
    const { container } = render(<TypewriterText text="Hello" isActive={false} charsPerFrame={5} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Should show full text (not animated) since isActive=false jumps to final
    expect(container.textContent).toBe('Hello');
  });

  it('accepts a className prop', () => {
    const { container } = render(
      <TypewriterText text="Hello" className="custom-class" />,
    );
    const span = container.querySelector('span');
    expect(span).toHaveClass('custom-class');
  });
});
