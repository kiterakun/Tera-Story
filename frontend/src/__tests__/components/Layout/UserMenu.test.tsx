import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../../../components/Layout/UserMenu';

// Mock the auth store
const mockLogout = vi.fn();
const mockNavigate = vi.fn();
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { username: 'alice' }, logout: mockLogout }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('UserMenu', () => {
  it('renders avatar button with aria-label', () => {
    renderWithRouter(<UserMenu />);
    const btn = screen.getByRole('button', { name: /account menu for alice/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-haspopup', 'menu');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('avatar shows first letter of username', () => {
    renderWithRouter(<UserMenu />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('opens dropdown when button clicked', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    expect(screen.getByRole('button', { name: /account menu for alice/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('dropdown has menu role with logout option', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    // setup.ts defaults to Vietnamese ('Đăng xuất')
    expect(screen.getByRole('menuitem', { name: /đăng xuất/i })).toBeInTheDocument();
  });

  it('logout button calls auth logout + navigates to /login', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /đăng xuất/i }));
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('closes on ESC key', () => {
    renderWithRouter(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu for alice/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
