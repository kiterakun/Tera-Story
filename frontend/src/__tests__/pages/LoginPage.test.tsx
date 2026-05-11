import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../../pages/LoginPage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../stores/authStore', () => {
  const state = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    loadUser: vi.fn(),
  };

  return {
    useAuthStore: vi.fn((selector) => selector(state)),
  };
});

vi.mock('../../stores/settingsStore', () => {
  const state = { settings: { language: 'en' }, isLoading: false };

  return {
    useSettingsStore: vi.fn((selector) => selector(state)),
  };
});

describe('LoginPage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
