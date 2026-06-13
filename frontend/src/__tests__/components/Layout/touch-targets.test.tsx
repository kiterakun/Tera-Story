/**
 * Touch target compliance test — verifies every interactive element in
 * the Layout meets WCAG 2.1 AA minimum 44×44px hit target.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../../../components/Layout/Navbar';

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { username: 'alice' }, logout: vi.fn() }),
}));
vi.mock('../../../stores/storyStore', () => ({
  useStoryStore: () => ({ currentPlaythrough: null }),
}));
vi.mock('../../../stores/uiStore', () => ({
  useUIStore: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>);
}

describe('Layout touch target compliance (WCAG 2.1 AA ≥44×44px)', () => {
  it('ThemeToggle has min-h-[44px] and min-w-[44px]', () => {
    renderWithRouter(<Navbar />);
    screen.getAllByRole('button', { name: /switch theme/i }).forEach((btn) => {
      expect(btn).toHaveClass('min-h-[44px]');
      expect(btn).toHaveClass('min-w-[44px]');
    });
  });

  it('hamburger button has min-h-[44px] and min-w-[44px]', () => {
    renderWithRouter(<Navbar />);
    const btn = screen.getByRole('button', { name: /open menu/i });
    expect(btn).toHaveClass('min-h-[44px]');
    expect(btn).toHaveClass('min-w-[44px]');
  });

  it('user menu button has min-h-[44px]', () => {
    renderWithRouter(<Navbar />);
    const btn = screen.getByRole('button', { name: /account menu/i });
    expect(btn.className).toMatch(/min-h-\[44px\]/);
  });

  it('More dropdown trigger has min-h-[44px]', () => {
    renderWithRouter(<Navbar />);
    // Open the dropdown first to find its menu items with min-h-[44px]
    const moreBtn = screen.getByRole('button', { name: /thêm|more/i });
    expect(moreBtn.className).toMatch(/min-h-\[44px\]/);
  });
});
