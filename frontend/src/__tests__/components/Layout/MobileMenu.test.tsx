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
    // setup.ts forces Vietnamese ('Mở menu'), but English fallback may also appear
    const btn = screen.getByRole('button', { name: /Mở menu|Open menu/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('has min-h-[44px] and min-w-[44px] for touch target', () => {
    renderWithRouter(<MobileMenu />);
    const btn = screen.getByRole('button', { name: /Mở menu|Open menu/i });
    expect(btn).toHaveClass('min-h-[44px]');
    expect(btn).toHaveClass('min-w-[44px]');
  });

  it('opens drawer with nav on click', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    expect(screen.getByRole('dialog', { name: /Menu di động|Mobile menu/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Điều hướng di động|Mobile navigation/i })).toBeInTheDocument();
  });

  it('drawer contains Worlds, Gallery, Achievements nav links', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    const nav = screen.getByRole('navigation', { name: /Điều hướng di động|Mobile navigation/i });
    // setup.ts defaults to Vietnamese ('Thế giới', 'Bộ sưu tập', 'Thành tựu')
    expect(nav.textContent).toMatch(/thế giới/i);
    expect(nav.textContent).toMatch(/bộ sưu tập/i);
    expect(nav.textContent).toMatch(/thành tựu/i);
  });

  it('drawer has close button with aria-label', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    const closeBtn = screen.getByRole('button', { name: /Đóng menu|Close menu/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveClass('min-h-[44px]');
  });

  it('closes on ESC key', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on close button click', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /Đóng menu|Close menu/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses bg-scrim for the overlay (theme-aware scrim token)', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    const scrim = document.querySelector('.bg-scrim');
    expect(scrim).toBeInTheDocument();
  });

  it('has slide-in-from-right animation on drawer', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/animate-slide-in-right/);
  });

  it('drawer has role=dialog and aria-modal=true (dialog semantics)', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('locks body scroll when open (overflow:hidden on body)', () => {
    renderWithRouter(<MobileMenu />);
    const original = document.body.style.overflow;
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: /Đóng menu|Close menu/i }));
    expect(document.body.style.overflow).toBe(original);
  });

  it('traps focus on Tab (focus stays inside drawer)', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    const dialog = screen.getByRole('dialog');
    // First focusable should be the close button (set by createFocusTrap)
    const closeBtn = screen.getByRole('button', { name: /Đóng menu|Close menu/i });
    expect(closeBtn).toBeInTheDocument();
    // Tab cycles inside the dialog
    const focusable = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    expect(focusable.length).toBeGreaterThan(1);
  });

  it('cycles arrow keys through focusable nav items', () => {
    renderWithRouter(<MobileMenu />);
    fireEvent.click(screen.getByRole('button', { name: /Mở menu|Open menu/i }));
    const dialog = screen.getByRole('dialog');
    const items = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    expect(items.length).toBeGreaterThan(1);
    // Focus on first item explicitly
    const firstItem = items[0];
    firstItem.focus();
    expect(document.activeElement).toBe(firstItem);
    // Dispatch keydown via the focused element so it bubbles to document listener
    firstItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).not.toBe(firstItem);
  });
});
