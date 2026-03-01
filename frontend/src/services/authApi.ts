import { api } from './api';

interface AuthResponse { token: string; user: { id: string; username: string; email: string }; }

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}
export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', { username, email, password });
  return res.data;
}
export async function getMe(): Promise<AuthResponse['user']> {
  const res = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
  return res.data.user;
}
