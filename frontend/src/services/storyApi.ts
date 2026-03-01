import { api } from './api';

export async function getStoryState(playthroughId: string) {
  const res = await api.get(`/story/${playthroughId}/state`);
  return res.data;
}

// Streaming is done via fetch() in useStoryStream hook — not Axios
// because Axios doesn't support streaming responses well
export async function generateChapter(_playthroughId: string, _choice?: string): Promise<string> {
    throw new Error('Use useStoryStream hook for generation');
}
