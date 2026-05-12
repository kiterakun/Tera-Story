import { api } from './api';
import type { FateThreadsGraph, PeekResponse } from '@/types';

export type { ThreadNode, ThreadEdge, FateThreadsGraph, PeekResponse } from '@/types';

export async function getThreads(playthroughId: string) {
  const res = await api.get<{ status: string; data: FateThreadsGraph }>(
    `/playthroughs/${playthroughId}/threads`
  );
  return res.data;
}

export async function peekThread(
  playthroughId: string,
  currentChapterId: string,
  choiceIndex: number,
  language: 'en' | 'vi'
) {
  const res = await api.post<{ status: string; data: PeekResponse }>(
    `/playthroughs/${playthroughId}/threads/peek`,
    { currentChapterId, choiceIndex, language }
  );
  return res.data;
}
