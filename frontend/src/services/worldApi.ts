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
  _id?: string;
  worldId?: string;
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
  createdAt: string;
  updatedAt: string;
}

export async function listWorlds(): Promise<World[]> {
  const { data } = await api.get('/worlds');
  return data.worlds;
}

export async function getWorld(id: string): Promise<{ world: World; specialItemTemplates: SpecialItemTemplate[] }> {
  const { data } = await api.get(`/worlds/${id}`);
  return { world: data.world, specialItemTemplates: data.specialItemTemplates || [] };
}

export async function createWorld(payload: Partial<World> & { specialItemTemplates?: SpecialItemTemplate[] }): Promise<{ world: World; specialItemTemplates: SpecialItemTemplate[] }> {
  const { data } = await api.post('/worlds', payload);
  return { world: data.world, specialItemTemplates: data.specialItemTemplates || [] };
}

export async function updateWorld(id: string, payload: Partial<World>): Promise<World> {
  const { data } = await api.put(`/worlds/${id}`, payload);
  return data.world;
}

export async function deleteWorld(id: string): Promise<void> {
  await api.delete(`/worlds/${id}`);
}

export async function createFromTemplate(templateId: string, name: string): Promise<{ world: World; specialItemTemplates: SpecialItemTemplate[] }> {
  const { data } = await api.post(`/worlds/from-template/${templateId}`, { name });
  return { world: data.world, specialItemTemplates: data.specialItemTemplates || [] };
}

// Special Item Template CRUD
export async function listSpecialItemTemplates(worldId: string): Promise<SpecialItemTemplate[]> {
  const { data } = await api.get(`/worlds/${worldId}/special-item-templates`);
  return data.specialItemTemplates;
}

export async function createSpecialItemTemplate(worldId: string, template: Omit<SpecialItemTemplate, '_id' | 'worldId'>): Promise<SpecialItemTemplate> {
  const { data } = await api.post(`/worlds/${worldId}/special-item-templates`, template);
  return data.specialItemTemplate;
}

export async function batchCreateSpecialItemTemplates(worldId: string, templates: Omit<SpecialItemTemplate, '_id' | 'worldId'>[]): Promise<SpecialItemTemplate[]> {
  const { data } = await api.post(`/worlds/${worldId}/special-item-templates/batch`, { templates });
  return data.specialItemTemplates;
}

export async function updateSpecialItemTemplate(id: string, payload: Partial<SpecialItemTemplate>): Promise<SpecialItemTemplate> {
  const { data } = await api.put(`/special-item-templates/${id}`, payload);
  return data.specialItemTemplate;
}

export async function deleteSpecialItemTemplate(id: string): Promise<void> {
  await api.delete(`/special-item-templates/${id}`);
}
