import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';

vi.mock('../../services/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
}));

import * as authApi from '../../services/authApi';

const mockUser = { id: 'u1', username: 'testuser', email: 'test@test.com' };

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  vi.clearAllMocks();
});

describe('authStore', () => {
  describe('initial state', () => {
    it('has user as null', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('has isAuthenticated as false', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('has isLoading as false', () => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('sets isLoading true, calls API, sets user on success', async () => {
      vi.mocked(authApi.login).mockResolvedValue({ user: mockUser });

      const promise = useAuthStore.getState().login('test@test.com', 'password');

      expect(useAuthStore.getState().isLoading).toBe(true);

      await promise;

      expect(authApi.login).toHaveBeenCalledWith('test@test.com', 'password');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(authApi.login).mockRejectedValue(error);

      await expect(useAuthStore.getState().login('bad', 'creds')).rejects.toThrow('Invalid credentials');

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('sets isLoading true, calls API, sets user on success', async () => {
      vi.mocked(authApi.register).mockResolvedValue({ user: mockUser });

      const promise = useAuthStore.getState().register('newuser', 'new@test.com', 'pass123');

      expect(useAuthStore.getState().isLoading).toBe(true);

      await promise;

      expect(authApi.register).toHaveBeenCalledWith('newuser', 'new@test.com', 'pass123');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      const error = new Error('Email taken');
      vi.mocked(authApi.register).mockRejectedValue(error);

      await expect(useAuthStore.getState().register('u', 'e@e.com', 'pw')).rejects.toThrow('Email taken');

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    it('calls API, clears user and isAuthenticated', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      expect(authApi.logout).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears state even when logout API fails', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('loadUser', () => {
    it('sets user and isAuthenticated on success', async () => {
      vi.mocked(authApi.getMe).mockResolvedValue(mockUser);

      await useAuthStore.getState().loadUser();

      expect(authApi.getMe).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('clears user and isAuthenticated on failure', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      vi.mocked(authApi.getMe).mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().loadUser();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
