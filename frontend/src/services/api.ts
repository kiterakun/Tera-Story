import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { showError } from '../lib/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/logout');
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      
      // Clear state directly to avoid infinite loop from logout() API call
      useAuthStore.setState({ user: null, isAuthenticated: false });
      
      if (!isAuthEndpoint && !isAuthPage) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 500) {
      showError('Server Error', error.response?.data?.error || 'An unexpected server error occurred.');
    } else if (!error.response && error.message === 'Network Error') {
      showError('Connection Error', 'Unable to reach the server. Please check your connection.');
    }
    return Promise.reject(error);
  }
);
