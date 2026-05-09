import { api } from './api';

interface AuthResponse { user: { id: string; username: string; email: string } }

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}
export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', { username, email, password });
  return res.data;
}
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
export async function getMe(): Promise<AuthResponse['user']> {
  const res = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
  return res.data.user;
}
