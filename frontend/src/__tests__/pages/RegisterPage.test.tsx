import { describe, expect, it, vi } from 'vitest';
import RegisterPage from '../../pages/RegisterPage';
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

describe('RegisterPage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<RegisterPage />);

    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });
});
