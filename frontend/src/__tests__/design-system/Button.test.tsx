import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../design-system/Button';

describe('Button primitive', () => {
  it('renders with default primary variant and md size', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-accent-600');
    expect(btn).toHaveClass('h-11');
  });

  it('renders all 5 variants with the expected class signature', () => {
    const variants = [
      { v: 'primary',   classNeedle: 'bg-accent-600' },
      { v: 'secondary', classNeedle: 'bg-ink-800' },
      { v: 'ghost',     classNeedle: 'bg-transparent' },
      { v: 'danger',    classNeedle: 'bg-danger' },
      { v: 'gold',      classNeedle: 'bg-gold' },
    ] as const;
    for (const { v, classNeedle } of variants) {
      const { unmount } = render(<Button variant={v}>x</Button>);
      const btn = screen.getByRole('button', { name: /x/i });
      expect(btn, `variant=${v} should contain ${classNeedle}`).toHaveClass(classNeedle);
      unmount();
    }
  });

  it('renders all 3 sizes with the expected minimum height', () => {
    const sizes = [
      { s: 'sm', min: 'h-9' },
      { s: 'md', min: 'h-11' },
      { s: 'lg', min: 'h-12' },
    ] as const;
    for (const { s, min } of sizes) {
      const { unmount } = render(<Button size={s}>x</Button>);
      const btn = screen.getByRole('button', { name: /x/i });
      expect(btn, `size=${s} should have ${min}`).toHaveClass(min);
      unmount();
    }
  });

  it('honors disabled prop', () => {
    render(<Button disabled>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeDisabled();
  });

  it('enters loading state: disabled + aria-busy + shows spinner', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('fires onClick when enabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does NOT fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does NOT fire onClick when loading', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as <a> when href is provided', () => {
    render(<Button href="/foo">Go</Button>);
    const a = screen.getByRole('link', { name: /go/i });
    expect(a.tagName).toBe('A');
    expect(a).toHaveAttribute('href', '/foo');
  });

  it('anchor renders with aria-disabled when disabled', () => {
    render(<Button href="/foo" disabled>Go</Button>);
    const a = screen.getByText(/go/i).closest('a');
    expect(a).not.toBeNull();
    expect(a).toHaveAttribute('aria-disabled', 'true');
    expect(a).not.toHaveAttribute('href');
  });

  it('accepts className for layout overrides', () => {
    render(<Button className="w-full">Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toHaveClass('w-full');
  });

  it('default type is "button" (not "submit") to prevent accidental form submission', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('renders left and right icons', () => {
    render(
      <Button
        leftIcon={<span data-testid="left">L</span>}
        rightIcon={<span data-testid="right">R</span>}
      >
        Save
      </Button>,
    );
    expect(screen.getByTestId('left')).toBeInTheDocument();
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('hides left icon while loading and keeps content slot visible for layout stability', () => {
    render(
      <Button loading leftIcon={<span data-testid="left">L</span>}>
        Save
      </Button>,
    );
    expect(screen.queryByTestId('left')).not.toBeInTheDocument();
    // Text remains in DOM but visually hidden to prevent layout shift.
    expect(screen.getByText(/save/i)).toBeInTheDocument();
  });

  it('has focus-visible ring classes for keyboard accessibility', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn.className).toMatch(/focus-visible:ring/);
  });

  it('respects custom type prop', () => {
    render(<Button type="submit">Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toHaveAttribute('type', 'submit');
  });
});
