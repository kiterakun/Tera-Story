import { api } from './api';

export interface ResourceTemplate {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum';
  min?: number;
  max?: number;
  defaultValue?: string | number;
  displayFormat?: string;
  options?: string[];
}

export interface SpecialItemFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'enum';
  options?: string[];
  required?: boolean;
}

export interface SpecialItemTemplate {
  category: string;
  description: string;
  fields: SpecialItemFieldDefinition[];
}

export interface World {
  _id: string;
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  imageUrl?: string;
  resourceTemplates: ResourceTemplate[];
  specialItemTemplates: SpecialItemTemplate[];
  createdAt: string;
  updatedAt: string;
}

export async function listWorlds(): Promise<World[]> {
  const { data } = await api.get('/worlds');
  return data.worlds;
}

export async function getWorld(id: string): Promise<World> {
  const { data } = await api.get(`/worlds/${id}`);
  return data.world;
}

export async function createWorld(payload: Partial<World>): Promise<World> {
  const { data } = await api.post('/worlds', payload);
  return data.world;
}

export async function updateWorld(id: string, payload: Partial<World>): Promise<World> {
  const { data } = await api.put(`/worlds/${id}`, payload);
  return data.world;
}

export async function deleteWorld(id: string): Promise<void> {
  await api.delete(`/worlds/${id}`);
}

export async function createFromTemplate(templateId: string, name: string): Promise<World> {
  const { data } = await api.post(`/worlds/from-template/${templateId}`, { name });
  return data.world;
}
