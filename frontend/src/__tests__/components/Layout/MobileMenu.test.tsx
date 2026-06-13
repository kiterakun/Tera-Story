import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileMenu } from '../../../components/Layout/MobileMenu';

// Mocks
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { username: 'alice' }, logout: vi.fn() }),
}));
vi.mock('../../../stores/storyStore', () => ({
  useStoryStore: () => ({ currentPlaythrough: null }),
}));

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>);
}

describe('MobileMenu', () => {
  it('renders hamburger button with aria-label', () => {
    renderWithRouter(<MobileMenu />);
    const btn = screen.getByRole('button', { name: /open menu/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('has min-h-[44px] and min-w-[44px] for touch target', () => {
    renderWithRouter(<MobileMenu />);
    const btn = screen.getByRole('button', { name: /open menu/i });
    expect(btn).toHaveClass('min-h-[44px]');
    expect(btn).toHaveClass('min-w-[44px]');
  });

  it('opens drawer with nav on click', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('dialog', { name: /mobile menu/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
  });

  it('drawer contains Worlds, Gallery, Achievements nav links', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    // setup.ts defaults to Vietnamese ('Thế giới', 'Bộ sưu tập', 'Thành tựu')
    expect(nav.textContent).toMatch(/thế giới/i);
    expect(nav.textContent).toMatch(/bộ sưu tập/i);
    expect(nav.textContent).toMatch(/thành tựu/i);
  });

  it('drawer has close button with aria-label', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    const closeBtn = screen.getByRole('button', { name: /close menu/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveClass('min-h-[44px]');
  });

  it('closes on ESC key', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on close button click', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
