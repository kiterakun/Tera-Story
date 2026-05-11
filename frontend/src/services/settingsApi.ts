import { api } from './api';

export async function getSettings(): Promise<unknown> {
  const response = await api.get('/settings');
  return response.data.settings;
}

export async function updateSettings(data: unknown): Promise<unknown> {
  const response = await api.put('/settings', data);
  return response.data.settings;
}

export async function updateAIConfig(data: unknown): Promise<unknown> {
  const response = await api.put('/settings/ai', data);
  return response.data.settings;
}
