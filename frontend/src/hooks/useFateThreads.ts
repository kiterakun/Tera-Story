import { useState, useEffect, useCallback } from 'react';
import * as fateThreadsApi from '../services/fateThreadsApi';
import type { FateThreadsGraph, PeekResponse } from '../services/fateThreadsApi';
import { useSettingsStore } from '../stores/settingsStore';

export function useFateThreads(playthroughId: string | undefined) {
  const [graph, setGraph] = useState<FateThreadsGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peekLoading, setPeekLoading] = useState(false);
  const [peekResult, setPeekResult] = useState<PeekResponse | null>(null);
  const [peekError, setPeekError] = useState<string | null>(null);

  const language = useSettingsStore((s) => s.settings?.language) || 'vi';

  const fetchThreads = useCallback(async () => {
    if (!playthroughId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fateThreadsApi.getThreads(playthroughId);
      setGraph(res.data);
    } catch {
      setError('Failed to load fate threads');
    } finally {
      setLoading(false);
    }
  }, [playthroughId]);

  const peekGhostThread = useCallback(
    async (chapterId: string, choiceIndex: number) => {
      if (!playthroughId) return;
      setPeekLoading(true);
      setPeekError(null);
      setPeekResult(null);
      try {
        const res = await fateThreadsApi.peekThread(
          playthroughId,
          chapterId,
          choiceIndex,
          language as 'en' | 'vi'
        );
        setPeekResult(res.data);
      } catch {
        setPeekError('Failed to peek ghost thread');
      } finally {
        setPeekLoading(false);
      }
    },
    [playthroughId, language]
  );

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    graph,
    loading,
    error,
    refetch: fetchThreads,
    peekLoading,
    peekResult,
    peekError,
    peekGhostThread,
    clearPeek: () => {
      setPeekResult(null);
      setPeekError(null);
    },
  };
}
