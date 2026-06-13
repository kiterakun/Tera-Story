import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../../../components/Layout/ThemeToggle';

// Mock the UI store
const mockSetTheme = vi.fn();
vi.mock('../../../stores/uiStore', () => ({
  useUIStore: () => ({ theme: 'dark', setTheme: mockSetTheme }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders as a button with aria-label', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label');
    expect(btn.getAttribute('aria-label')).toMatch(/switch theme/i);
  });

  it('has min-h and min-w of 44px for touch target', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('min-h-[44px]');
    expect(btn).toHaveClass('min-w-[44px]');
  });

  it('calls setTheme with the next theme in cycle', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('cyberpunk');
  });

  it('has focus-visible ring for keyboard accessibility', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button').className).toMatch(/focus-visible:ring/);
  });
});
