import { useState, useEffect, useCallback } from 'react';
import * as chronicleApi from '../services/chronicleApi';
import type { ChronicleData } from '../services/chronicleApi';

export function useChronicle(playthroughId: string, forceRegenerate?: boolean) {
  const [chronicle, setChronicle] = useState<ChronicleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await chronicleApi.fetchChronicle(playthroughId, forceRegenerate);
      setChronicle(res.data);
    } catch {
      setError('Failed to load chronicle');
    } finally {
      setIsLoading(false);
    }
  }, [playthroughId, forceRegenerate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { chronicle, isLoading, error, refetch: fetch };
}
