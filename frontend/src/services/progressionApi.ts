import { api } from './api';

export interface UserProgress {
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: number;
  levelTitle: string;
  totalScenesCompleted: number;
  totalChoicesMade: number;
  totalCombatWon: number;
  totalPlaythroughsCompleted: number;
  totalAchievementsUnlocked: number;
  recentXpHistory: Array<{
    amount: number;
    source: string;
    timestamp: string;
  }>;
}

export interface AddXpResult {
  xp: number;
  level: number;
  leveledUp: boolean;
  newLevel?: number;
  xpToNextLevel: number;
  xpProgress: number;
}

export interface LevelHistoryEntry {
  level: number;
  reachedAt: string;
  totalXpAtTime: number;
}

export interface XpReference {
  rewards: Record<string, number>;
  titles: Record<string, string>;
  levelCurve: Array<{ level: number; xpToNext: number }>;
}

export async function getUserProgress() {
  const res = await api.get<{ status: string; data: UserProgress }>('/user/progress');
  return res.data;
}

export async function addXp(amount: number, source: string, metadata?: { playthroughId?: string; sceneId?: string; achievementKey?: string }) {
  const res = await api.post<{ status: string; data: AddXpResult }>('/user/xp', { amount, source, metadata });
  return res.data;
}

export async function getLevelHistory(limit?: number) {
  const res = await api.get<{ status: string; data: { history: LevelHistoryEntry[] } }>('/user/level-history', { params: { limit } });
  return res.data;
}

export async function getXpReference() {
  const res = await api.get<{ status: string; data: XpReference }>('/user/xp-reference');
  return res.data;
}
