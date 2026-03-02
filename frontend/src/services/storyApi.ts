import { api } from './api';

export interface GenerateChapterResponse {
  success: boolean;
  chapter: {
    _id: string;
    content: string;
    chapterIndex: number;
    choices: Array<{ text: string; type: 'continue' | 'new_arc' | 'custom' }>;
    status: 'generating' | 'completed' | 'failed';
    toolsStatus?: 'pending' | 'running' | 'completed' | 'failed';
    playerChoice: string;
  };
  content: string;
}

export async function getStoryState(playthroughId: string) {
  const res = await api.get(`/story/${playthroughId}/state`);
  return res.data;
}

export async function generateChapter(playthroughId: string, choice: string): Promise<GenerateChapterResponse> {
  const res = await api.post('/story/generate', { playthroughId, choice });
  return res.data;
}

export async function retryChapter(chapterId: string): Promise<GenerateChapterResponse> {
  const res = await api.post('/story/retry', { chapterId });
  return res.data;
}

export async function retryChapterTools(chapterId: string): Promise<GenerateChapterResponse> {
  const res = await api.post('/story/retry-tools', { chapterId });
  return res.data;
}

export interface SummarizeArcResponse {
  success: boolean;
  completedArc: {
    _id: string;
    title: string;
    arcIndex: number;
    summary: string;
  };
  newArc: {
    _id: string;
    title: string;
    arcIndex: number;
  };
}

export async function summarizeArc(playthroughId: string): Promise<SummarizeArcResponse> {
  const res = await api.post('/story/summarize-arc', { playthroughId });
  return res.data;
}
