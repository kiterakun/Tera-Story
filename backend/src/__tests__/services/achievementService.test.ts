import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Achievement } from '../../models/Achievement';
import { UserAchievement } from '../../models/UserAchievement';
import { User } from '../../models/User';
import {
  checkAchievements,
  getAchievements,
  getRecentAchievements,
  initializeUserAchievements,
} from '../../services/achievementService';

const achievementDefinitions = [
  {
    key: 'first_steps',
    name: { en: 'First Scene', vi: 'Canh Dau' },
    description: { en: 'Complete 1 scene', vi: 'Hoan thanh 1 canh' },
    icon: 'star',
    category: 'milestone' as const,
    rarity: 'common' as const,
    hidden: false,
    unlockCriteria: { type: 'count' as const, field: 'totalScenesCompleted', threshold: 1 },
    xpReward: 50,
    sortOrder: 1,
  },
  {
    key: 'halfway_there',
    name: { en: 'Level 10', vi: 'Cap 10' },
    description: { en: 'Reach level 10', vi: 'Dat cap 10' },
    icon: 'trophy',
    category: 'milestone' as const,
    rarity: 'uncommon' as const,
    hidden: false,
    unlockCriteria: { type: 'count' as const, field: 'level', threshold: 10 },
    xpReward: 100,
    sortOrder: 2,
  },
  {
    key: 'warrior',
    name: { en: 'Warrior', vi: 'Chien Binh' },
    description: { en: 'Win 10 combats', vi: 'Thang 10 tran' },
    icon: 'sword',
    category: 'combat' as const,
    rarity: 'rare' as const,
    hidden: false,
    unlockCriteria: { type: 'count' as const, field: 'totalCombatWon', threshold: 10 },
    xpReward: 250,
    sortOrder: 3,
  },
  {
    key: 'epic_pull',
    name: { en: 'Epic Pull', vi: 'Rut The Epic' },
    description: { en: 'Unlock an epic card', vi: 'Mo khoa the epic' },
    icon: 'gem',
    category: 'collection' as const,
    rarity: 'rare' as const,
    hidden: false,
    unlockCriteria: { type: 'specific_action' as const, condition: 'epic_card_unlocked' },
    xpReward: 200,
    sortOrder: 4,
  },
];

async function createTestUser(overrides: Partial<{
  level: number;
  xp: number;
  totalScenesCompleted: number;
  totalChoicesMade: number;
  totalCombatWon: number;
  totalPlaythroughsCompleted: number;
  totalAchievementsUnlocked: number;
}> = {}) {
  const id = new mongoose.Types.ObjectId().toString();

  return User.create({
    username: `ach-${id.slice(-12)}`,
    email: `achievement-${id}@test.com`,
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

describe('achievementService', () => {
  beforeAll(async () => {
    await User.syncIndexes();
    await Achievement.syncIndexes();
    await UserAchievement.syncIndexes();
  });

  beforeEach(async () => {
    // setup.ts cleans DB after each test.
    await Achievement.create(achievementDefinitions);
  });

  describe('initializeUserAchievements', () => {
    it('creates user achievement records from seed achievements', async () => {
      const user = await createTestUser();
      const userId = String(user._id);

      await initializeUserAchievements(userId);

      const records = await UserAchievement.find({ userId }).lean();
      const recordsByKey = new Map(records.map((record) => [record.achievementKey, record]));

      expect(records.length).toBeGreaterThanOrEqual(achievementDefinitions.length);
      for (const definition of achievementDefinitions) {
        const record = recordsByKey.get(definition.key);
        expect(record?.progress).toBe(0);
        expect(record?.unlockedAt).toBeNull();
      }
    });

    it('is idempotent on second call', async () => {
      const user = await createTestUser();
      const userId = String(user._id);

      await initializeUserAchievements(userId);
      const countAfterFirstCall = await UserAchievement.countDocuments({ userId });

      await initializeUserAchievements(userId);
      const countAfterSecondCall = await UserAchievement.countDocuments({ userId });

      expect(countAfterSecondCall).toBe(countAfterFirstCall);
    });
  });

  describe('checkAchievements', () => {
    it('unlocks count-based achievements when user field reaches threshold', async () => {
      const user = await createTestUser({ totalScenesCompleted: 1 });
      const userId = String(user._id);

      const result = await checkAchievements(userId, { type: 'scene_completed' });

      expect(result.unlocked.map((achievement) => achievement.key)).toContain('first_steps');
      expect(result.progressUpdated).toContain('first_steps');

      const record = await UserAchievement.findOne({ userId, achievementKey: 'first_steps' }).lean();
      expect(record?.unlockedAt).toBeInstanceOf(Date);
    });

    it('tracks count-based progress without unlocking below threshold', async () => {
      const user = await createTestUser({ totalCombatWon: 4 });
      const userId = String(user._id);
      await initializeUserAchievements(userId);
      await UserAchievement.updateOne(
        { userId, achievementKey: 'halfway_there' },
        { $set: { progress: 1 } }
      );

      const result = await checkAchievements(userId, { type: 'combat_won' });

      expect(result.unlocked.map((achievement) => achievement.key)).not.toContain('warrior');
      expect(result.progressUpdated).toContain('warrior');

      const record = await UserAchievement.findOne({ userId, achievementKey: 'warrior' }).lean();
      expect(record?.progress).toBe(4);
      expect(record?.unlockedAt).toBeNull();
    });

    it('unlocks level-based criteria when field is level', async () => {
      const user = await createTestUser({ level: 10 });
      const userId = String(user._id);

      const result = await checkAchievements(userId, { type: 'scene_completed' });

      expect(result.unlocked.map((achievement) => achievement.key)).toContain('halfway_there');

      const record = await UserAchievement.findOne({ userId, achievementKey: 'halfway_there' }).lean();
      expect(record?.unlockedAt).toBeInstanceOf(Date);
    });

    it('unlocks specific action achievements when event condition matches criteria', async () => {
      const user = await createTestUser();
      const userId = String(user._id);

      const result = await checkAchievements(userId, {
        type: 'card_unlocked',
        data: { condition: 'epic_card_unlocked' },
      });

      expect(result.unlocked.map((achievement) => achievement.key)).toContain('epic_pull');

      const record = await UserAchievement.findOne({ userId, achievementKey: 'epic_pull' }).lean();
      expect(record?.unlockedAt).toBeInstanceOf(Date);
    });

    it('does not unlock specific action achievements when event condition differs', async () => {
      const user = await createTestUser();
      const userId = String(user._id);

      const result = await checkAchievements(userId, {
        type: 'card_unlocked',
        data: { condition: 'common_card_unlocked' },
      });

      expect(result.unlocked.map((achievement) => achievement.key)).not.toContain('epic_pull');

      const record = await UserAchievement.findOne({ userId, achievementKey: 'epic_pull' }).lean();
      expect(record?.unlockedAt).toBeNull();
    });

    it('returns no updates when no progress changes and no criteria match', async () => {
      const user = await createTestUser();
      const userId = String(user._id);
      await initializeUserAchievements(userId);
      await UserAchievement.updateOne(
        { userId, achievementKey: 'halfway_there' },
        { $set: { progress: 1 } }
      );

      const result = await checkAchievements(userId, { type: 'choice_made' });

      expect(result).toEqual({ unlocked: [], progressUpdated: [] });
    });

    it('throws error when user is not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      await expect(checkAchievements(userId, { type: 'scene_completed' })).rejects.toThrow('User not found');
    });

    it('prevents duplicate unlocks on repeated checks', async () => {
      const user = await createTestUser({ totalScenesCompleted: 1 });
      const userId = String(user._id);

      const firstResult = await checkAchievements(userId, { type: 'scene_completed' });
      const secondResult = await checkAchievements(userId, { type: 'scene_completed' });

      expect(firstResult.unlocked.map((achievement) => achievement.key)).toContain('first_steps');
      expect(secondResult.unlocked.map((achievement) => achievement.key)).not.toContain('first_steps');

      const unlockedRecords = await UserAchievement.countDocuments({
        userId,
        achievementKey: 'first_steps',
        unlockedAt: { $ne: null },
      });
      expect(unlockedRecords).toBe(1);
    });
  });

  describe('getAchievements', () => {
    it('returns all achievements with user progress metadata', async () => {
      const user = await createTestUser({ totalCombatWon: 4 });
      const userId = String(user._id);
      await checkAchievements(userId, { type: 'combat_won' });

      const result = await getAchievements(userId);

      expect(result.achievements).toHaveLength(achievementDefinitions.length);
      expect(result.stats).toEqual({ total: achievementDefinitions.length, unlocked: 0, percentComplete: 0 });
      expect(result.achievements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'warrior', unlocked: false, progress: 4 }),
          expect.objectContaining({ key: 'first_steps', unlocked: false, progress: 0 }),
        ])
      );
    });

    it('filters achievements by category, status, and rarity', async () => {
      const user = await createTestUser({ totalScenesCompleted: 1 });
      const userId = String(user._id);
      await checkAchievements(userId, { type: 'scene_completed' });

      const milestoneResult = await getAchievements(userId, { category: 'milestone' });
      const unlockedResult = await getAchievements(userId, { status: 'unlocked' });
      const rareResult = await getAchievements(userId, { rarity: 'rare' });
      const lockedRareResult = await getAchievements(userId, { status: 'locked', rarity: 'rare' });

      expect(milestoneResult.achievements.map((achievement) => achievement.key)).toEqual([
        'first_steps',
        'halfway_there',
      ]);
      expect(unlockedResult.achievements.map((achievement) => achievement.key)).toContain('first_steps');
      expect(unlockedResult.achievements.every((achievement) => achievement.unlocked)).toBe(true);
      expect(rareResult.achievements.map((achievement) => achievement.key)).toEqual([
        'warrior',
        'epic_pull',
      ]);
      expect(lockedRareResult.achievements.every((achievement) => !achievement.unlocked && achievement.rarity === 'rare')).toBe(true);
    });

    it('filters achievements with in-progress status', async () => {
      const user = await createTestUser({ totalCombatWon: 4 });
      const userId = String(user._id);
      await initializeUserAchievements(userId);
      await UserAchievement.updateOne(
        { userId, achievementKey: 'halfway_there' },
        { $set: { progress: 1 } }
      );
      await checkAchievements(userId, { type: 'combat_won' });

      const result = await getAchievements(userId, { status: 'in_progress' });

      expect(result.achievements.length).toBeGreaterThan(0);
      expect(result.achievements.every((achievement) => !achievement.unlocked && achievement.progress > 0)).toBe(true);
      expect(result.achievements).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: 'warrior', progress: 4 })])
      );
    });
  });

  describe('getRecentAchievements', () => {
    it('returns recently unlocked achievements in newest-first order', async () => {
      const user = await createTestUser();
      const userId = String(user._id);
      await initializeUserAchievements(userId);

      const olderDate = new Date('2026-01-01T00:00:00.000Z');
      const newerDate = new Date('2026-01-02T00:00:00.000Z');
      await UserAchievement.updateOne(
        { userId, achievementKey: 'first_steps' },
        { $set: { unlockedAt: olderDate, progress: 1 } }
      );
      await UserAchievement.updateOne(
        { userId, achievementKey: 'epic_pull' },
        { $set: { unlockedAt: newerDate, progress: 1 } }
      );

      const result = await getRecentAchievements(userId);

      expect(result).toHaveLength(2);
      expect(result[0]?.achievementKey).toBe('epic_pull');
      expect(result[0]?.achievement?.key).toBe('epic_pull');
      expect(result[1]?.achievementKey).toBe('first_steps');
      expect(result[1]?.achievement?.key).toBe('first_steps');
    });

    it('returns empty array when no achievements are unlocked', async () => {
      const user = await createTestUser();
      const userId = String(user._id);
      await initializeUserAchievements(userId);

      const result = await getRecentAchievements(userId);

      expect(result).toEqual([]);
    });
  });
});
