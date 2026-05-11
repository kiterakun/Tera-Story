import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface WhisperItem {
  type: 'rumor' | 'letter' | 'diary' | 'news';
  content: string;
  relatedEntityType?: 'character' | 'location' | 'item' | 'arc';
  relatedEntityId?: string;
  attribution?: string;
}

export interface WhispersData {
  playthroughId: string;
  whispers: WhisperItem[];
  daysAway: number;
  generatedAt?: string;
  hasNew: boolean;
  needsGeneration?: boolean;
}

export function useWhispers(playthroughId: string | undefined) {
  const [data, setData] = useState<WhispersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!playthroughId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ status: string; data: WhispersData }>(`/playthroughs/${playthroughId}/whispers`);
      setData(res.data.data);
    } catch {
      setError('Failed to load whispers');
    } finally {
      setIsLoading(false);
    }
  }, [playthroughId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const markViewed = useCallback(async () => {
    if (!playthroughId) return;
    try {
      await api.post(`/playthroughs/${playthroughId}/whispers/mark-viewed`);
      setData((prev) => prev ? { ...prev, hasNew: false } : prev);
    } catch {
      // non-fatal
    }
  }, [playthroughId]);

  return { data, isLoading, error, markViewed, refetch: fetch };
}
