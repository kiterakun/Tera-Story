import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { showError } from '../lib/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      showError('Server Error', error.response?.data?.error || 'An unexpected server error occurred.');
    } else if (!error.response && error.message === 'Network Error') {
      showError('Connection Error', 'Unable to reach the server. Please check your connection.');
    }
    return Promise.reject(error);
  }
);
