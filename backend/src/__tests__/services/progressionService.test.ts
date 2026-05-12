import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import {
  addXp,
  getLevelHistory,
  getLevelTitle,
  getUserProgress,
  LEVEL_TITLES,
  totalXpForLevel,
  XP_REWARDS,
  xpRequiredForLevel,
} from '../../services/progressionService';

async function createTestUser(overrides: Partial<{
  level: number;
  xp: number;
  totalScenesCompleted: number;
  totalChoicesMade: number;
  totalCombatWon: number;
  totalPlaythroughsCompleted: number;
  totalAchievementsUnlocked: number;
  xpHistory: Array<{ amount: number; source: 'scene_complete' | 'choice_made' | 'combat_win' | 'achievement_unlock' | 'playthrough_complete' | 'daily_login'; timestamp: Date }>;
}> = {}) {
  const id = new mongoose.Types.ObjectId().toString();

  return User.create({
    username: `progress-${id.slice(-12)}`,
    email: `progress-${id}@test.com`,
    password: 'password123',
    level: 1,
    xp: 0,
    totalScenesCompleted: 0,
    totalChoicesMade: 0,
    totalCombatWon: 0,
    totalPlaythroughsCompleted: 0,
    totalAchievementsUnlocked: 0,
    ...overrides,
  });
}

describe('progressionService', () => {
  let userId: string;

  beforeAll(async () => {
    await User.syncIndexes();
  });

  beforeEach(async () => {
    const user = await createTestUser();
    userId = String(user._id);
  });

  describe('XP_REWARDS', () => {
    it('exports expected reward constants', () => {
      expect(XP_REWARDS).toMatchObject({
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
      });
    });
  });

  describe('LEVEL_TITLES', () => {
    it('exports expected title constants', () => {
      expect(LEVEL_TITLES).toMatchObject({
        1: 'Người Mới',
        5: 'Nhà Thám Hiểm',
        10: 'Người Kể Chuyện',
        15: 'Anh Hùng',
        20: 'Huyền Thoại',
        30: 'Bậc Thầy Thế Giới',
        50: 'Đấng Sáng Tạo',
      });
    });
  });

  describe('xpRequiredForLevel', () => {
    it('returns rounded exponential XP needed for next level', () => {
      expect(xpRequiredForLevel(1)).toBe(100);
      expect(xpRequiredForLevel(2)).toBe(110);
      expect(xpRequiredForLevel(10)).toBeCloseTo(236, 0);
    });
  });

  describe('totalXpForLevel', () => {
    it('returns cumulative XP needed to reach level', () => {
      expect(totalXpForLevel(1)).toBe(0);
      expect(totalXpForLevel(2)).toBe(100);
      expect(totalXpForLevel(3)).toBe(210);
    });
  });

  describe('getLevelTitle', () => {
    it('returns highest title at or below level threshold', () => {
      expect(getLevelTitle(1)).toBe('Người Mới');
      expect(getLevelTitle(4)).toBe('Người Mới');
      expect(getLevelTitle(5)).toBe('Nhà Thám Hiểm');
      expect(getLevelTitle(19)).toBe('Anh Hùng');
      expect(getLevelTitle(20)).toBe('Huyền Thoại');
      expect(getLevelTitle(50)).toBe('Đấng Sáng Tạo');
    });
  });

  describe('addXp', () => {
    it('adds XP to user and returns AddXpResult', async () => {
      const result = await addXp(userId, 10, 'scene_complete');

      expect(result).toEqual({
        xp: 10,
        level: 1,
        leveledUp: false,
        newLevel: undefined,
        xpToNextLevel: 100,
        xpProgress: 10,
      });

      const user = await User.findById(userId).lean();
      expect(user?.xp).toBe(10);
      expect(user?.level).toBe(1);
    });

    it.each([
      ['scene_complete', 'totalScenesCompleted'],
      ['choice_made', 'totalChoicesMade'],
      ['combat_win', 'totalCombatWon'],
      ['playthrough_complete', 'totalPlaythroughsCompleted'],
      ['achievement_unlock', 'totalAchievementsUnlocked'],
    ] as const)('increments %s stat', async (source, statField) => {
      await addXp(userId, 1, source);

      const user = await User.findById(userId).lean();
      expect(user?.[statField]).toBe(1);
    });

    it('triggers level up when XP crosses threshold', async () => {
      const result = await addXp(userId, 100, 'scene_complete');

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.level).toBe(2);
      expect(result.xp).toBe(100);
      expect(result.xpToNextLevel).toBe(110);
      expect(result.xpProgress).toBe(0);

      const user = await User.findById(userId).lean();
      expect(user?.level).toBe(2);
    });

    it('handles multiple level-ups in one call', async () => {
      const result = await addXp(userId, 210, 'playthrough_complete');

      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(3);
      expect(result.level).toBe(3);
      expect(result.xp).toBe(210);
      expect(result.xpToNextLevel).toBe(xpRequiredForLevel(3));
      expect(result.xpProgress).toBe(0);
    });

    it('stores XP history when metadata is provided', async () => {
      const metadata = {
        playthroughId: new mongoose.Types.ObjectId().toString(),
        sceneId: new mongoose.Types.ObjectId().toString(),
      };

      await addXp(userId, 10, 'scene_complete', metadata);

      const user = await User.findById(userId).lean();
      expect(user?.xpHistory).toHaveLength(1);
      expect(user?.xpHistory?.[0]).toMatchObject({
        amount: 10,
        source: 'scene_complete',
      });
      expect(user?.xpHistory?.[0]?.timestamp).toBeInstanceOf(Date);
    });

    it('caps xpHistory at 50 entries', async () => {
      for (let i = 0; i < 55; i += 1) {
        await addXp(userId, i + 1, 'choice_made');
      }

      const user = await User.findById(userId).lean();
      expect(user?.xpHistory).toHaveLength(50);
      expect(user?.xpHistory?.[0]?.amount).toBe(6);
      expect(user?.xpHistory?.[49]?.amount).toBe(55);
    });

    it('throws User not found for nonexistent userId', async () => {
      const missingUserId = new mongoose.Types.ObjectId().toString();

      await expect(addXp(missingUserId, 10, 'scene_complete')).rejects.toThrow('User not found');
    });
  });

  describe('getUserProgress', () => {
    it('returns formatted progress object with stats and recent history', async () => {
      const user = await createTestUser({
        xp: 150,
        level: 2,
        totalScenesCompleted: 3,
        totalChoicesMade: 4,
        totalCombatWon: 2,
        totalPlaythroughsCompleted: 1,
        totalAchievementsUnlocked: 5,
        xpHistory: [
          { amount: 10, source: 'scene_complete', timestamp: new Date('2026-01-01T00:00:00.000Z') },
          { amount: 20, source: 'combat_win', timestamp: new Date('2026-01-02T00:00:00.000Z') },
        ],
      });

      const progress = await getUserProgress(String(user._id));

      expect(progress).toEqual({
        xp: 150,
        level: 2,
        xpToNextLevel: 110,
        xpProgress: 45,
        levelTitle: 'Người Mới',
        totalScenesCompleted: 3,
        totalChoicesMade: 4,
        totalCombatWon: 2,
        totalPlaythroughsCompleted: 1,
        totalAchievementsUnlocked: 5,
        recentXpHistory: [
          { amount: 20, source: 'combat_win', timestamp: new Date('2026-01-02T00:00:00.000Z') },
          { amount: 10, source: 'scene_complete', timestamp: new Date('2026-01-01T00:00:00.000Z') },
        ],
      });
    });
  });

  describe('getLevelHistory', () => {
    it('returns level-up entries sorted newest first', async () => {
      const user = await createTestUser({
        xp: 260,
        level: 3,
        xpHistory: [
          { amount: 50, source: 'scene_complete', timestamp: new Date('2026-01-01T00:00:00.000Z') },
          { amount: 50, source: 'scene_complete', timestamp: new Date('2026-01-02T00:00:00.000Z') },
          { amount: 160, source: 'playthrough_complete', timestamp: new Date('2026-01-03T00:00:00.000Z') },
        ],
      });

      const history = await getLevelHistory(String(user._id));

      expect(history).toEqual([
        {
          level: 3,
          reachedAt: new Date('2026-01-03T00:00:00.000Z'),
          totalXpAtTime: 260,
        },
        {
          level: 2,
          reachedAt: new Date('2026-01-02T00:00:00.000Z'),
          totalXpAtTime: 100,
        },
      ]);
    });

    it('respects limit parameter', async () => {
      const user = await createTestUser({
        xp: 500,
        level: 5,
        xpHistory: [
          { amount: 100, source: 'scene_complete', timestamp: new Date('2026-01-01T00:00:00.000Z') },
          { amount: 110, source: 'scene_complete', timestamp: new Date('2026-01-02T00:00:00.000Z') },
          { amount: 121, source: 'scene_complete', timestamp: new Date('2026-01-03T00:00:00.000Z') },
          { amount: 169, source: 'scene_complete', timestamp: new Date('2026-01-04T00:00:00.000Z') },
        ],
      });

      const history = await getLevelHistory(String(user._id), 2);

      expect(history).toHaveLength(2);
      expect(history.map((entry) => entry.level)).toEqual([5, 4]);
    });
  });
});
