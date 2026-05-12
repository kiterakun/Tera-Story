import { useState, useEffect, useCallback } from 'react';
import * as dailyApi from '../services/dailyApi';
import type { DailyStatus } from '../services/dailyApi';

export function useDaily() {
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dailyApi.getDailyStatus();
      setDailyStatus(res.data);
    } catch {
      setError('Không thể tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  }, []);

  const claimDaily = useCallback(async () => {
    const res = await dailyApi.claimDaily();
    await fetchStatus();
    return res.data;
  }, [fetchStatus]);

  const claimQuest = useCallback(
    async (questId: string) => {
      const res = await dailyApi.claimQuest(questId);
      await fetchStatus();
      return res.data;
    },
    [fetchStatus]
  );

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    dailyStatus,
    loading,
    error,
    fetchStatus,
    claimDaily,
    claimQuest,
  };
}
