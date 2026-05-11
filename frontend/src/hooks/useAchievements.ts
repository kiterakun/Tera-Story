import { useState, useEffect, useCallback } from 'react';
import * as achievementApi from '../services/achievementApi';
import type { AchievementWithProgress } from '../services/achievementApi';

export function useAchievements(params?: {
  category?: string;
  status?: string;
  rarity?: string;
}) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [stats, setStats] = useState<{ total: number; unlocked: number; percentComplete: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await achievementApi.fetchAchievements({
        category: params?.category,
        status: params?.status,
        rarity: params?.rarity,
      });
      setAchievements(res.data.achievements);
      setStats(res.data.stats);
    } catch {
      setError('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, [params?.category, params?.status, params?.rarity]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { achievements, stats, isLoading, error, refetch: fetch };
}
