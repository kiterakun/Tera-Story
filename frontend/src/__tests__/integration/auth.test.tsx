import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { renderWithRouter } from '../test-utils';
import LoginPage from '../../pages/LoginPage';
import { useAuthStore } from '../../stores/authStore';
import * as authApi from '../../services/authApi';

// Mock auth API — all tests use controlled responses
vi.mock('../../services/authApi');

// Mock i18n — avoid pulling in settingsStore dependency
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    login: {
      title: 'Tera-Story',
      subtitle: 'Enter the realm of infinite stories',
      email: 'Email',
      password: 'Password',
      emailPlaceholder: 'you@example.com',
      loginBtn: 'Login',
      passwordPlaceholder: '••••••••',
      loggingIn: 'Entering...',
      noAccount: "Don't have an account?",
      register: 'Register',
      failed: 'Failed to login',
    },
  }),
}));

// Mock image import — jsdom cannot handle .png files
vi.mock('../../assets/logo.png', () => ({ default: 'test-logo.png' }));

describe('Auth Integration', () => {
  const mockLogin = vi.mocked(authApi.login);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });

  it('login flow: fill form → submit → API called → store updated', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@test.com' };
    mockLogin.mockResolvedValueOnce({ user: mockUser });

    renderWithRouter(<LoginPage />, { initialEntries: ['/login'] });

    const user = userEvent.setup();

    // Fill email and password
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Login' }));

    // Verify auth API was called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });

    // Verify the auth store was updated after successful login
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  it('protected page: unauthenticated → redirect to /login', () => {
    // Inline protected page component — not modifying existing code
    function ProtectedPage() {
      const isAuthenticated = useAuthStore(s => s.isAuthenticated);
      if (!isAuthenticated) return <Navigate to="/login" replace />;
      return <div>Protected Content</div>;
    }

    // Ensure store is in unauthenticated state
    useAuthStore.setState({ isAuthenticated: false, user: null });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Redirected to login page — protected content should not be visible
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
