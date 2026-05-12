import { api } from './api';

export interface DailyQuest {
  _id: string;
  questType: 'read_scenes' | 'make_choices' | 'win_combat' | 'unlock_achievement' | 'collect_card';
  title: string;
  description: string;
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
  claimed: boolean;
  xpReward: number;
}

export interface DailyStatus {
  todayClaimed: boolean;
  currentStreak: number;
  longestStreak: number;
  weekProgress: boolean[];
  streakFreezesAvailable: number;
  dailyQuests: DailyQuest[];
  nextResetTime: string;
}

export interface ClaimDailyResponse {
  streak: number;
  xpEarned: number;
  bonus: number;
  dayNumber: number;
}

export interface ClaimQuestResponse {
  xpEarned: number;
}

export interface UpdateQuestProgressResponse {
  questUpdated: boolean;
  completed: boolean;
}

export async function getDailyStatus() {
  const res = await api.get<{ status: string; data: DailyStatus }>('/daily/status');
  return res.data;
}

export async function claimDaily() {
  const res = await api.post<{ status: string; data: ClaimDailyResponse }>('/daily/claim');
  return res.data;
}

export async function claimQuest(questId: string) {
  const res = await api.post<{ status: string; data: ClaimQuestResponse }>(
    `/daily/quests/${questId}/claim`
  );
  return res.data;
}

export async function updateQuestProgress(questType: string, increment: number) {
  const res = await api.post<{ status: string; data: UpdateQuestProgressResponse }>(
    '/daily/quests/progress',
    { questType, increment }
  );
  return res.data;
}
