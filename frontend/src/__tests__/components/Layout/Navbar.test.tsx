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

describe('Navbar', () => {
  it('renders logo with brand text', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByAltText(/tera-story/i)).toBeInTheDocument();
  });

  it('renders primary navigation landmark', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
  });

  it('primary nav contains Worlds, Gallery, Achievements', () => {
    renderWithRouter(<Navbar />);
    const nav = screen.getByRole('navigation', { name: /primary navigation/i });
    // setup.ts defaults to Vietnamese
    expect(nav.textContent).toMatch(/thế giới/i);
    expect(nav.textContent).toMatch(/bộ sưu tập/i);
    expect(nav.textContent).toMatch(/thành tựu/i);
  });

  it('renders theme toggle button with aria-label (desktop + mobile)', () => {
    renderWithRouter(<Navbar />);
    const btns = screen.getAllByRole('button', { name: /switch theme/i });
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });

  it('renders UserMenu with aria-label', () => {
    renderWithRouter(<Navbar />);
    const userBtn = screen.getByRole('button', { name: /account menu/i });
    expect(userBtn).toBeInTheDocument();
  });

  it('renders hamburger menu button (visible mobile)', () => {
    renderWithRouter(<Navbar />);
    const ham = screen.getByRole('button', { name: /open menu/i });
    expect(ham).toBeInTheDocument();
  });
});
