import { useState, useCallback } from 'react';
import * as leaderboardApi from '../services/leaderboardApi';
import type { LeaderboardEntry, LeaderboardType, LeaderboardScope, LeaderboardPeriod } from '../services/leaderboardApi';

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [type, setType] = useState<LeaderboardType>('scenes');
  const [scope, setScope] = useState<LeaderboardScope>('friends');
  const [period, setPeriod] = useState<LeaderboardPeriod>('this_week');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (
    lbType: LeaderboardType,
    lbScope: LeaderboardScope,
    lbPeriod: LeaderboardPeriod
  ) => {
    setType(lbType);
    setScope(lbScope);
    setPeriod(lbPeriod);
    setIsLoading(true);
    setError(null);
    try {
      const res = await leaderboardApi.getLeaderboard(lbType, lbScope, lbPeriod);
      setEntries(res.data.entries);
      setMyRank(res.data.myRank);
    } catch {
      setError('Không thể tải bảng xếp hạng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    entries,
    myRank,
    type,
    scope,
    period,
    isLoading,
    error,
    fetchLeaderboard,
  };
}
