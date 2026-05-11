import { api } from './api';

export interface ArcSummary {
  arcId: string;
  title: string;
  summary: string;
  sceneCount: number;
  keyScenes: Array<{
    sceneId: string;
    title: string;
    thumbnailUrl?: string;
  }>;
}

export interface ChronicleStats {
  totalScenes: number;
  totalChoices: number;
  totalCombats: number;
  totalPlayTimeMinutes: number;
  completionPercent?: number;
}

export interface ChronicleData {
  playthroughName: string;
  worldId: string;
  status: string;
  chronicle: {
    generatedAt: string;
    arcSummaries: ArcSummary[];
    stats: ChronicleStats;
  } | null;
  completedAt: string | null;
}

export async function fetchChronicle(playthroughId: string, forceRegenerate?: boolean) {
  const res = await api.get<{ status: string; data: ChronicleData }>(
    `/playthroughs/${playthroughId}/chronicle`,
    { params: forceRegenerate ? { forceRegenerate: 'true' } : undefined }
  );
  return res.data;
}

export async function regenerateChronicle(playthroughId: string) {
  const res = await api.post<{ status: string; data: { chronicle: ChronicleData['chronicle'] } }>(
    `/playthroughs/${playthroughId}/chronicle/regenerate`
  );
  return res.data;
}

export async function shareChronicle(playthroughId: string) {
  const res = await api.post<{ status: string; data: { shareUrl: string } }>(
    `/playthroughs/${playthroughId}/chronicle/share`
  );
  return res.data;
}

export async function fetchChronicleStats(playthroughId: string) {
  const res = await api.get<{ status: string; data: ChronicleStats }>(
    `/playthroughs/${playthroughId}/chronicle/stats`
  );
  return res.data;
}
