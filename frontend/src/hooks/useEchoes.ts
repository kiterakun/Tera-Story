import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface EchoItem {
  _id: string;
  type: 'mercy' | 'betrayal' | 'discovery' | 'consequence';
  description: string;
  narrative: string;
  status: 'planted' | 'approaching' | 'active' | 'resolved';
  triggerChapterIndex: number;
  targetChapterIndex: number;
  minChapterDelay: number;
  resolvedAt: string | null;
}

export function useEchoes(playthroughId: string | undefined) {
  const [echoes, setEchoes] = useState<EchoItem[]>([]);
  const [pendingEchoes, setPendingEchoes] = useState<EchoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!playthroughId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [allRes, pendingRes] = await Promise.all([
        api.get<{ status: string; data: { echoes: EchoItem[] } }>(`/playthroughs/${playthroughId}/echoes`),
        api.get<{ status: string; data: { echoes: EchoItem[] } }>(`/playthroughs/${playthroughId}/echoes/pending`),
      ]);
      setEchoes(allRes.data.data.echoes);
      setPendingEchoes(pendingRes.data.data.echoes);
    } catch {
      setError('Failed to load echoes');
    } finally {
      setIsLoading(false);
    }
  }, [playthroughId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { echoes, pendingEchoes, isLoading, error, refetch: fetch };
}
