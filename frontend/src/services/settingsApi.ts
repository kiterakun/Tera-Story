import { api } from './api';

export async function getSettings(): Promise<any> {
  const response = await api.get('/settings');
  return response.data;
}

export async function updateSettings(data: any): Promise<any> {
  const response = await api.put('/settings', data);
  return response.data;
}

export async function updateAIConfig(data: any): Promise<any> {
  const response = await api.put('/settings/ai', data);
  return response.data;
}
