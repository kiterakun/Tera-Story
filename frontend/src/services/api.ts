import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { showError } from '../lib/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface AuthUser {
  id: string;
  username: string;
  email: string;
}

interface RefreshResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

interface ApiErrorBody {
  error?: string;
  code?: string;
}

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function resolveRefreshQueue(token: string | null): void {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
}

function clearAuthAndRedirect(config?: InternalAxiosRequestConfig): void {
  const isAuthEndpoint = config?.url?.includes('/auth/me') || config?.url?.includes('/auth/login') || config?.url?.includes('/auth/logout') || config?.url?.includes('/auth/refresh');
  const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });

  if (!isAuthEndpoint && !isAuthPage) {
    window.location.href = '/login';
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (error.response?.status === 401) {
      const code = error.response.data?.code;

      if (code === 'token_expired' && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push((token) => {
              if (!token) {
                reject(error);
                return;
              }

              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const response = await api.post<RefreshResponse>('/auth/refresh');
          const { token, user } = response.data;
          useAuthStore.setState({ user, token, isAuthenticated: true });
          resolveRefreshQueue(token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          resolveRefreshQueue(null);
          clearAuthAndRedirect(originalRequest);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      clearAuthAndRedirect(originalRequest);
    } else if (error.response?.status === 500) {
      showError('Server Error', error.response?.data?.error || 'An unexpected server error occurred.');
    } else if (!error.response && error.message === 'Network Error') {
      showError('Connection Error', 'Unable to reach the server. Please check your connection.');
    }
    return Promise.reject(error);
  }
);
