import { User } from '../models/User';
import type { IUserDocument, XpSource } from '../models/User';

// --- XP Rewards Table ---

export const XP_REWARDS: Record<string, number> = {
  scene_complete: 10,
  choice_made: 5,
  combat_win: 20,
  achievement_unlock_common: 50,
  achievement_unlock_uncommon: 100,
  achievement_unlock_rare: 250,
  achievement_unlock_epic: 500,
  playthrough_complete: 200,
  daily_login: 25,
  daily_login_streak_7: 100,
  daily_login_streak_30: 500,
};

// --- Level Titles ---

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Người Mới',
  5: 'Nhà Thám Hiểm',
  10: 'Người Kể Chuyện',
  15: 'Anh Hùng',
  20: 'Huyền Thoại',
  30: 'Bậc Thầy Thế Giới',
  50: 'Đấng Sáng Tạo',
};

// --- Level Curve (Exponential) ---

/**
 * XP required to go from level N to level N+1.
 * Curve: 100 * 1.1^(level - 1)
 */
export function xpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.1, level - 1));
}

/**
 * Total cumulative XP needed to reach a given level.
 */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

/**
 * Get the level title for a given level.
 * Returns the highest title at or below the current level.
 */
export function getLevelTitle(level: number): string {
  const thresholds = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) {
      return LEVEL_TITLES[threshold]!;
    }
  }
  return LEVEL_TITLES[1]!;
}

// --- Stat Increment Map ---

const STAT_INCREMENT_MAP: Partial<Record<XpSource, keyof IUserDocument>> = {
  scene_complete: 'totalScenesCompleted',
  choice_made: 'totalChoicesMade',
  combat_win: 'totalCombatWon',
  playthrough_complete: 'totalPlaythroughsCompleted',
  achievement_unlock: 'totalAchievementsUnlocked',
};

// --- Core Functions ---

export interface AddXpResult {
  xp: number;
  level: number;
  leveledUp: boolean;
  newLevel?: number;
  xpToNextLevel: number;
  xpProgress: number;
}

/**
 * Award XP to a user. Handles stat increments, xpHistory capping,
 * and level-up detection. Called internally from storyOrchestrator,
 * combatService, and other services.
 */
export async function addXp(
  userId: string,
  amount: number,
  source: XpSource,
  metadata?: { playthroughId?: string; sceneId?: string; achievementKey?: string }
): Promise<AddXpResult> {
  void metadata;
  if (amount <= 0) {
    throw new Error('XP amount must be positive');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Add XP
  user.xp = (user.xp ?? 0) + amount;

  // Increment corresponding stat
  const statField = STAT_INCREMENT_MAP[source];
  if (statField) {
    user.set(statField, ((user.get(statField) ?? 0) as number) + 1);
  }

  // Push to xpHistory, cap at 50 entries
  if (!user.xpHistory) {
    user.xpHistory = [];
  }
  user.xpHistory.push({
    amount,
    source,
    timestamp: new Date(),
  });
  if (user.xpHistory.length > 50) {
    user.xpHistory = user.xpHistory.slice(-50);
  }

  // Check level up (may chain multiple levels)
  let leveledUp = false;
  while (true) {
    if (user.xp >= totalXpForLevel(user.level + 1)) {
      user.level += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  await user.save();

  const xpToNextLevel = xpRequiredForLevel(user.level);
  const xpIntoCurrentLevel =
    user.xp - totalXpForLevel(user.level);
  const xpProgress = Math.min(100, Math.round((xpIntoCurrentLevel / xpToNextLevel) * 100));

  return {
    xp: user.xp,
    level: user.level,
    leveledUp,
    newLevel: leveledUp ? user.level : undefined,
    xpToNextLevel,
    xpProgress,
  };
}

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
    timestamp: Date;
  }>;
}

/**
 * Get full progression data for a user.
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error('User not found');
  }

  const level = user.level ?? 1;
  const xp = user.xp ?? 0;
  const xpToNextLevel = xpRequiredForLevel(level);
  const xpIntoCurrentLevel = xp - totalXpForLevel(level);
  const xpProgress = Math.min(100, Math.round((xpIntoCurrentLevel / xpToNextLevel) * 100));

  const history = user.xpHistory ?? [];
  const recentXpHistory = history
    .slice(-5)
    .reverse()
    .map((entry) => ({
      amount: entry.amount,
      source: entry.source,
      timestamp: entry.timestamp,
    }));

  return {
    xp,
    level,
    xpToNextLevel,
    xpProgress,
    levelTitle: getLevelTitle(level),
    totalScenesCompleted: user.totalScenesCompleted ?? 0,
    totalChoicesMade: user.totalChoicesMade ?? 0,
    totalCombatWon: user.totalCombatWon ?? 0,
    totalPlaythroughsCompleted: user.totalPlaythroughsCompleted ?? 0,
    totalAchievementsUnlocked: user.totalAchievementsUnlocked ?? 0,
    recentXpHistory,
  };
}

export interface LevelHistoryEntry {
  level: number;
  reachedAt: Date;
  totalXpAtTime: number;
}

/**
 * Get level-up history for a user (derived from xpHistory).
 */
export async function getLevelHistory(
  userId: string,
  limit: number = 20
): Promise<LevelHistoryEntry[]> {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error('User not found');
  }

  const history = user.xpHistory ?? [];
  const levelUps: LevelHistoryEntry[] = [];
  let runningXp = 0;
  let lastLevel = 1;

  for (const entry of history) {
    runningXp += entry.amount;
    // Calculate current level based on running XP
    let currentLevel = 1;
    for (let checkLevel = 2; checkLevel <= 100; checkLevel++) {
      if (runningXp >= totalXpForLevel(checkLevel)) {
        currentLevel = checkLevel;
      } else {
        break;
      }
    }
    if (currentLevel > lastLevel) {
      for (let lvl = lastLevel + 1; lvl <= currentLevel; lvl++) {
        levelUps.push({
          level: lvl,
          reachedAt: entry.timestamp,
          totalXpAtTime: runningXp,
        });
      }
      lastLevel = currentLevel;
    }
  }

  return levelUps.slice(-limit).reverse();
}
