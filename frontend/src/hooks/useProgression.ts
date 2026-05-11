import { useState, useEffect, useCallback } from 'react';
import * as progressionApi from '../services/progressionApi';
import type { UserProgress } from '../services/progressionApi';

export function useProgression() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await progressionApi.getUserProgress();
      setProgress(res.data);
    } catch {
      setError('Failed to load progression');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { progress, isLoading, error, refetch: fetch };
}
