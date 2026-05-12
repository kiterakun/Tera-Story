import { api } from './api';

export interface ThreadNode {
  id: string;
  chapterId: string;
  chapterIndex: number;
  arcId: string;
  arcIndex: number;
  title: string;
  summary: string;
  imageUrl?: string;
  isCurrentPath: boolean;
  depth: number;
  isCompleted: boolean;
}

export interface ThreadEdge {
  from: string;
  to: string;
  choiceText: string;
  choiceType: string;
  isChosen: boolean;
  arcIndex: number;
}

export interface FateThreadsGraph {
  nodes: ThreadNode[];
  edges: ThreadEdge[];
  metadata: {
    playthroughId: string;
    totalChapters: number;
    totalArcs: number;
    currentChapterId: string;
    totalGhostBranches: number;
    totalPeekedGhosts: number;
  };
}

export interface PeekResponse {
  alternateDescription: string;
  choiceText: string;
  newDepth: number;
}

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
