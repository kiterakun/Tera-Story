/**
 * Arrow-key navigation tests for UserMenu and MoreDropdown.
 *
 * Verifies WAI-ARIA menu pattern keyboard support:
 * - ArrowDown / ArrowUp cycle focus between menuitems
 * - Home / End jump to first/last menuitem
 * - Escape closes (focus returns to trigger)
 * - Outside-click closes
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../../../components/Layout/UserMenu';
import { Navbar } from '../../../components/Layout/Navbar';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { username: 'alice' }, logout: mockLogout }),
}));
vi.mock('../../../stores/storyStore', () => ({
  useStoryStore: () => ({ currentPlaythrough: null }),
}));
vi.mock('../../../stores/uiStore', () => ({
  useUIStore: vi.fn((selector?: (s: { theme: string; setTheme: () => void }) => unknown) => (typeof selector === 'function' ? selector({ theme: 'dark', setTheme: vi.fn() }) : { theme: 'dark', setTheme: vi.fn() })),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>);
}

describe('UserMenu arrow-key navigation', () => {
  it('opens menu and focuses first menuitem on trigger click', async () => {
    renderWithRouter(<UserMenu />);
    const trigger = screen.getByRole('button', { name: /account menu for alice/i });
    fireEvent.click(trigger);
    // First menuitem (Settings link) should receive focus
    expect(screen.getByRole('menuitem', { name: /cài đặt/i })).toHaveFocus();
  });

  it('ArrowDown moves focus to next menuitem', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    const settings = screen.getByRole('menuitem', { name: /cài đặt/i });
    settings.focus();
    fireEvent.keyDown(settings, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: /đăng xuất/i })).toHaveFocus();
  });

  it('ArrowUp from first wraps to last', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    const settings = screen.getByRole('menuitem', { name: /cài đặt/i });
    settings.focus();
    fireEvent.keyDown(settings, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: /đăng xuất/i })).toHaveFocus();
  });

  it('Home moves focus to first menuitem', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    const logout = screen.getByRole('menuitem', { name: /đăng xuất/i });
    logout.focus();
    fireEvent.keyDown(logout, { key: 'Home' });
    expect(screen.getByRole('menuitem', { name: /cài đặt/i })).toHaveFocus();
  });

  it('End moves focus to last menuitem', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    const settings = screen.getByRole('menuitem', { name: /cài đặt/i });
    settings.focus();
    fireEvent.keyDown(settings, { key: 'End' });
    expect(screen.getByRole('menuitem', { name: /đăng xuất/i })).toHaveFocus();
  });

  it('Escape closes menu and returns focus to trigger', () => {
    renderWithRouter(<UserMenu />);
    const trigger = screen.getByRole('button', { name: /account menu for alice/i });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('logout menuitem triggers logout + navigation', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /đăng xuất/i }));
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

describe('MoreDropdown arrow-key navigation', () => {
  it('opens dropdown and focuses first menuitem on trigger click', () => {
    renderWithRouter(<Navbar />);
    const more = screen.getByRole('button', { name: /thêm/i });
    fireEvent.click(more);
    const items = screen.getAllByRole('menuitem');
    expect(items[0]).toHaveFocus();
  });

  it('ArrowDown cycles between menuitems', () => {
    renderWithRouter(<Navbar />);
    const more = screen.getByRole('button', { name: /thêm/i });
    fireEvent.click(more);
    const items = screen.getAllByRole('menuitem');
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(items[1]).toHaveFocus();
  });

  it('Escape closes dropdown', () => {
    renderWithRouter(<Navbar />);
    const more = screen.getByRole('button', { name: /thêm/i });
    fireEvent.click(more);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('outside-click closes dropdown', () => {
    renderWithRouter(<Navbar />);
    const more = screen.getByRole('button', { name: /thêm/i });
    fireEvent.click(more);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
