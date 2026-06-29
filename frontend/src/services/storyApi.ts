import { api } from './api';
import { useAuthStore } from '../stores/authStore';

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

/**
 * SSE streaming chapter generation.
 * Returns an object with a cancel function and emits callbacks:
 * - onToken: called for each text token
 * - onPhase: called when generation phase changes
 * - onComplete: called with final chapter data
 * - onError: called on error
 */
export function generateChapterStream(
  playthroughId: string,
  choice: string,
  callbacks: {
    onToken: (token: string) => void;
    onPhase?: (phase: string, message: string) => void;
    onComplete: (data: GenerateChapterResponse) => void;
    onError: (error: string) => void;
  }
): { cancel: () => void } {
  const controller = new AbortController();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Include the Bearer token explicitly so the raw fetch behaves the
  // same as the axios instance (which sets Authorization via
  // interceptor). Cookie auth still flows via credentials: 'include'.
  const bearerToken = useAuthStore.getState().token;

  fetch(`${baseUrl}/story/generate-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ playthroughId, choice }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Stream failed' }));
        callbacks.onError(err.error || 'Stream failed');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('No stream available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              if (eventType === 'token') {
                callbacks.onToken(data.token);
              } else if (eventType === 'phase') {
                callbacks.onPhase?.(data.phase, data.message);
              } else if (eventType === 'complete') {
                callbacks.onComplete(data);
              } else if (eventType === 'error') {
                callbacks.onError(data.error);
              }
            } catch { /* skip malformed data */ }
            eventType = '';
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError(err.message || 'Connection failed');
      }
    });

  return { cancel: () => controller.abort() };
}

export async function retryChapter(chapterId: string): Promise<GenerateChapterResponse> {
  const res = await api.post('/story/retry', { chapterId });
  return res.data;
}

export async function retryChapterTools(chapterId: string): Promise<GenerateChapterResponse> {
  const res = await api.post('/story/retry-tools', { chapterId });
  return res.data;
}

export interface GenerationState {
  _id: string;
  playthroughId: string;
  chapterId: string;
  status: 'running' | 'completed' | 'failed' | 'awaiting_user';
  currentPhase: 'context' | 'writing' | 'tools' | 'post_effects' | 'travel' | 'complete';
  phases: Array<{
    phase: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    attempts: number;
    maxAttempts: number;
    lastError?: { message: string; code?: string; timestamp: string };
  }>;
  autoRetryCount: number;
  userRetryCount: number;
  error?: {
    message: string;
    code?: string;
    failedPhase?: string;
    provider?: string;
    model?: string;
    details?: string;
  };
}

export interface GenerationStateResponse {
  state: GenerationState | null;
  recentEvents: EventLogEntry[];
}

export async function getGenerationState(playthroughId: string): Promise<GenerationStateResponse> {
  const res = await api.get(`/story/${playthroughId}/generation-state`);
  return res.data;
}

/**
 * SSE streaming resume of a paused/failed generation.
 * Same callback shape as generateChapterStream.
 */
export function resumeChapterStream(
  playthroughId: string,
  callbacks: {
    onToken: (token: string) => void;
    onPhase?: (phase: string, message: string) => void;
    onComplete: (data: GenerateChapterResponse) => void;
    onError: (error: string, details?: { phase?: string; details?: string }) => void;
  }
): { cancel: () => void } {
  const controller = new AbortController();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const bearerToken = useAuthStore.getState().token;

  fetch(`${baseUrl}/story/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ playthroughId }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Resume failed' }));
        callbacks.onError(err.error || 'Resume failed');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('No stream available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              if (eventType === 'token') {
                callbacks.onToken(data.token);
              } else if (eventType === 'phase') {
                callbacks.onPhase?.(data.phase, data.message);
              } else if (eventType === 'complete') {
                callbacks.onComplete(data);
              } else if (eventType === 'error') {
                callbacks.onError(data.error, { phase: data.phase, details: data.details });
              }
            } catch { /* skip malformed data */ }
            eventType = '';
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError(err.message || 'Connection failed');
      }
    });

  return { cancel: () => controller.abort() };
}

// ── Event Log ──────────────────────────────────────────────────────────────

export interface EventLogEntry {
  _id: string;
  playthroughId: string;
  chapterId?: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  source: string;
  title: string;
  description: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface EventLogListResponse {
  success: boolean;
  events: EventLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listEvents(
  playthroughId: string,
  options: { page?: number; limit?: number; severity?: string; type?: string } = {}
): Promise<EventLogListResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.severity) params.set('severity', options.severity);
  if (options.type) params.set('type', options.type);
  const res = await api.get(`/playthroughs/${playthroughId}/events?${params.toString()}`);
  return res.data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await api.delete(`/events/${eventId}`);
}

export async function deleteAllEvents(playthroughId: string): Promise<{ deletedCount: number }> {
  const res = await api.delete(`/playthroughs/${playthroughId}/events`);
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

