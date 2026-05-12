import { api } from './api';

export type LeaderboardType = 'scenes' | 'achievements' | 'streak' | 'cards';
export type LeaderboardScope = 'friends' | 'global';
export type LeaderboardPeriod = 'this_week' | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  value: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  myRank: number;
}

export async function getLeaderboard(
  type: LeaderboardType,
  scope: LeaderboardScope,
  period: LeaderboardPeriod
) {
  const res = await api.get<{ status: string; data: LeaderboardResult }>('/leaderboard', {
    params: { type, scope, period },
  });
  return res.data;
}
