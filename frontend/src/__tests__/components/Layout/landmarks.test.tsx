/**
 * Landmark verification test — confirms all <nav> elements have
 * accessible names. axe-core equivalent check via attribute assertions.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Layout landmarks (axe-core parity check)', () => {
  it('primary nav landmark has aria-label="Primary navigation"', () => {
    renderWithRouter(<Navbar />);
    const nav = screen.getByRole('navigation', { name: /primary navigation/i });
    expect(nav).toHaveAttribute('aria-label', 'Primary navigation');
  });

  it('user menu landmark has aria-label="User menu"', () => {
    renderWithRouter(<Navbar />);
    const nav = screen.getByRole('navigation', { name: /user menu/i });
    expect(nav).toHaveAttribute('aria-label', 'User menu');
  });

  it('mobile menu drawer landmark has aria-label="Mobile menu"', () => {
    renderWithRouter(<Navbar />);
    // Open the drawer
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const dialog = screen.getByRole('dialog', { name: /mobile menu/i });
    expect(dialog).toHaveAttribute('aria-label', 'Mobile menu');
  });

  it('mobile menu nav landmark has aria-label="Mobile navigation"', () => {
    renderWithRouter(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  it('More dropdown menu landmark has aria-label="More navigation"', () => {
    renderWithRouter(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: /thêm|more/i }));
    const menu = screen.getByRole('menu', { name: /more navigation/i });
    expect(menu).toHaveAttribute('aria-label', 'More navigation');
  });

  it('all nav elements in Navbar have accessible names (axe parity)', () => {
    const { container } = renderWithRouter(<Navbar />);
    const navs = container.querySelectorAll('nav');
    expect(navs.length).toBeGreaterThanOrEqual(2);
    navs.forEach((nav) => {
      expect(
        nav.hasAttribute('aria-label') || nav.hasAttribute('aria-labelledby'),
      ).toBe(true);
    });
  });
});
