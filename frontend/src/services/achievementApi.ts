import { api } from './api';

export interface AchievementData {
  _id: string;
  key: string;
  name: { en: string; vi: string };
  description: { en: string; vi: string };
  icon: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  hidden: boolean;
  unlockCriteria: {
    type: string;
    field?: string;
    threshold?: number;
    condition?: string;
  };
  xpReward: number;
  sortOrder: number;
}

export interface AchievementWithProgress extends AchievementData {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export interface AchievementListResult {
  achievements: AchievementWithProgress[];
  stats: {
    total: number;
    unlocked: number;
    percentComplete: number;
  };
}

export async function fetchAchievements(params?: {
  category?: string;
  status?: string;
  rarity?: string;
}) {
  const res = await api.get<{ status: string; data: AchievementListResult }>('/achievements', { params });
  return res.data;
}

export async function fetchAchievementDetail(key: string) {
  const res = await api.get<{
    status: string;
    data: { achievement: AchievementData; userProgress: { unlocked: boolean; unlockedAt: string | null; progress: number } | null };
  }>(`/achievements/${key}`);
  return res.data;
}

export async function fetchRecentAchievements() {
  const res = await api.get<{
    status: string;
    data: { recent: Array<{ achievement: AchievementData | null; unlockedAt: string | null }> };
  }>('/achievements/recent');
  return res.data;
}
