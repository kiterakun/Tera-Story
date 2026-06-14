import { describe, expect, it, vi } from 'vitest';
import LandingPage from '../../pages/LandingPage';
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
  const state = {
    settings: { language: 'vi' },
    isLoading: false,
  };
  return {
    useSettingsStore: vi.fn((selector) => selector(state)),
  };
});

describe('LandingPage smoke test', () => {
  it('renders the public premium landing content and auth CTAs', () => {
    renderWithRouter(<LandingPage />);

    // test-setup forces 'tera-lang' = 'vi', so all visible copy must come from the VI translation tree.
    expect(screen.getByRole('heading', { level: 1, name: /Xây dựng thế giới/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Bắt đầu chuyến đi/i })[0]).toHaveAttribute('href', '/register');
    expect(screen.getAllByRole('link', { name: /Đăng nhập/i })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('heading', { name: /Nền tảng truyện với bộ nhớ trạng thái trò chơi/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Thả tài sản điện ảnh của riêng bạn/i })).toBeInTheDocument();
  });
});
