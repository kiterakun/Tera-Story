import { api } from './api';
import type { Organization } from '@/types';

export async function listOrganizations(worldId: string, playthroughId: string): Promise<Organization[]> {
  const { data } = await api.get<{ organizations: Organization[] }>(
    `/worlds/${worldId}/playthroughs/${playthroughId}/organizations`
  );
  return data.organizations;
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await api.get<{ organization: Organization }>(`/organizations/${id}`);
  return data.organization;
}

export async function createOrganization(
  worldId: string,
  playthroughId: string,
  orgData: {
    name: string;
    description?: string;
    type: string;
    goals?: string;
    structure?: string;
  }
): Promise<Organization> {
  const { data } = await api.post<{ organization: Organization }>(
    `/worlds/${worldId}/playthroughs/${playthroughId}/organizations`,
    orgData
  );
  return data.organization;
}

export async function updateOrganization(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    type: string;
    goals: string;
    structure: string;
    status: 'active' | 'disbanded' | 'hidden';
  }>
): Promise<Organization> {
  const { data } = await api.patch<{ organization: Organization }>(
    `/organizations/${id}`,
    updates
  );
  return data.organization;
}

export async function restoreOrganization(
  worldId: string,
  playthroughId: string,
  id: string
): Promise<Organization> {
  const { data } = await api.post<{ organization: Organization }>(
    `/organizations/${id}/restore`
  );
  return data.organization;
}
