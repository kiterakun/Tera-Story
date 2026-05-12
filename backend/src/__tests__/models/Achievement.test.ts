/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Achievement } from '../../models/Achievement';
import { UserAchievement } from '../../models/UserAchievement';

const validAchievement = {
  key: 'test_ach',
  name: { en: 'Test', vi: 'Thu Nghiem' },
  description: { en: 'Test achievement', vi: 'Thanh tuu thu nghiem' },
  icon: 'star',
  category: 'milestone',
  rarity: 'common',
  hidden: false,
  unlockCriteria: { type: 'count', field: 'totalScenesCompleted', threshold: 1 },
  xpReward: 50,
  sortOrder: 1,
} as const;

describe('Achievement Model', () => {
  beforeEach(async () => {
    await Achievement.syncIndexes();
  });

  // --- Valid creation ---
  it('should create a valid achievement with all required fields', async () => {
    const ach = await Achievement.create(validAchievement);

    expect(ach._id).toBeDefined();
    expect(ach.key).toBe(validAchievement.key);
    expect(ach.name).toMatchObject(validAchievement.name);
    expect(ach.description).toMatchObject(validAchievement.description);
    expect(ach.icon).toBe(validAchievement.icon);
    expect(ach.category).toBe(validAchievement.category);
    expect(ach.rarity).toBe(validAchievement.rarity);
    expect(ach.hidden).toBe(validAchievement.hidden);
    expect(ach.unlockCriteria).toMatchObject(validAchievement.unlockCriteria);
    expect(ach.xpReward).toBe(validAchievement.xpReward);
    expect(ach.sortOrder).toBe(validAchievement.sortOrder);
  });

  // --- key required ---
  it('should require key', async () => {
    const { key: _key, ...data } = validAchievement;

    await expect(Achievement.create(data)).rejects.toThrow(/key/);
  });

  // --- key unique ---
  it('should enforce unique key', async () => {
    await Achievement.create(validAchievement);
    await expect(Achievement.create(validAchievement)).rejects.toThrow(/duplicate key/);
  });

  // --- category enum ---
  const validCategories = ['exploration', 'combat', 'collection', 'social', 'milestone', 'hidden'] as const;
  it.each(validCategories)('should accept category "%s"', async (category) => {
    const ach = await Achievement.create({ ...validAchievement, key: `cat_${category}`, category });
    expect(ach.category).toBe(category);
  });

  it('should reject invalid category', async () => {
    await expect(
      Achievement.create({ ...validAchievement, key: 'bad_cat', category: 'invalid' }),
    ).rejects.toThrow(/category/);
  });

  // --- rarity enum ---
  const validRarities = ['common', 'uncommon', 'rare', 'epic'] as const;
  it.each(validRarities)('should accept rarity "%s"', async (rarity) => {
    const ach = await Achievement.create({ ...validAchievement, key: `rar_${rarity}`, rarity });
    expect(ach.rarity).toBe(rarity);
  });

  it('should reject invalid rarity', async () => {
    await expect(
      Achievement.create({ ...validAchievement, key: 'bad_rar', rarity: 'legendary' }),
    ).rejects.toThrow(/rarity/);
  });

  // --- hidden defaults to false ---
  it('should default hidden to false', async () => {
    const { hidden: _hidden, ...data } = validAchievement;
    const ach = await Achievement.create(data);
    expect(ach.hidden).toBe(false);
  });

  // --- sortOrder defaults to 0 ---
  it('should default sortOrder to 0', async () => {
    const { sortOrder: _sortOrder, ...data } = validAchievement;
    const ach = await Achievement.create(data);
    expect(ach.sortOrder).toBe(0);
  });

  // --- name + description are localizedString subdocuments ---
  it('should require name.en', async () => {
    const data = {
      ...validAchievement,
      key: 'no_name_en',
      name: { vi: 'Thieu EN' },
    };
    await expect(Achievement.create(data)).rejects.toThrow(/name\.en/);
  });

  it('should require name.vi', async () => {
    const data = {
      ...validAchievement,
      key: 'no_name_vi',
      name: { en: 'Missing VI' },
    };
    await expect(Achievement.create(data)).rejects.toThrow(/name\.vi/);
  });

  it('should require description.en', async () => {
    const data = {
      ...validAchievement,
      key: 'no_desc_en',
      description: { vi: 'Thieu mo ta EN' },
    };
    await expect(Achievement.create(data)).rejects.toThrow(/description\.en/);
  });

  it('should require description.vi', async () => {
    const data = {
      ...validAchievement,
      key: 'no_desc_vi',
      description: { en: 'Missing desc VI' },
    };
    await expect(Achievement.create(data)).rejects.toThrow(/description\.vi/);
  });

  // --- unlockCriteria subdocument ---
  it('should require unlockCriteria', async () => {
    const { unlockCriteria: _unlockCriteria, ...data } = validAchievement;
    await expect(Achievement.create(data)).rejects.toThrow(/unlockCriteria/);
  });

  it('should require unlockCriteria.type', async () => {
    const data = {
      ...validAchievement,
      key: 'no_uc_type',
      unlockCriteria: { field: 'testField', threshold: 1 },
    };
    await expect(Achievement.create(data)).rejects.toThrow(/unlockCriteria\.type/);
  });

  const validUnlockTypes = ['count', 'specific_action', 'collection_threshold', 'playthrough_complete', 'streak'] as const;
  it.each(validUnlockTypes)('should accept unlockCriteria.type "%s"', async (type) => {
    const ach = await Achievement.create({
      ...validAchievement,
      key: `uctype_${type}`,
      unlockCriteria: { type, field: 'testField', threshold: 1 },
    });
    expect(ach.unlockCriteria.type).toBe(type);
  });

  it('should reject invalid unlockCriteria.type', async () => {
    const data = {
      ...validAchievement,
      key: 'bad_uc_type',
      unlockCriteria: { type: 'invalid_type', field: 'testField', threshold: 1 },
    };
    await expect(Achievement.create(data)).rejects.toThrow(/unlockCriteria\.type/);
  });

  // --- unlockCriteria optional fields ---
  it('should accept unlockCriteria without optional condition field', async () => {
    const data = {
      ...validAchievement,
      key: 'no_condition',
      unlockCriteria: { type: 'count', field: 'any', threshold: 5 },
    };
    const ach = await Achievement.create(data);
    expect(ach.unlockCriteria.condition).toBeUndefined();
  });

  it('should accept unlockCriteria with optional condition field', async () => {
    const data = {
      ...validAchievement,
      key: 'with_condition',
      unlockCriteria: { type: 'specific_action', field: 'actionName', condition: 'exact' },
    };
    const ach = await Achievement.create(data);
    expect(ach.unlockCriteria.condition).toBe('exact');
  });

  // --- xpReward required ---
  it('should require xpReward', async () => {
    const { xpReward: _xpReward, ...data } = validAchievement;

    await expect(Achievement.create(data)).rejects.toThrow(/xpReward/);
  });

  // --- timestamps ---
  it('should auto-generate timestamps', async () => {
    const ach = await Achievement.create(validAchievement);

    expect(ach.get('createdAt')).toBeInstanceOf(Date);
    expect(ach.get('updatedAt')).toBeInstanceOf(Date);
  });

  it('should update updatedAt on modification', async () => {
    const ach = await Achievement.create(validAchievement);
    const originalUpdatedAt = ach.get('updatedAt');

    // Wait a tick to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    ach.xpReward = 100;
    await ach.save();

    expect(ach.get('updatedAt').getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});

describe('UserAchievement Model', () => {
  beforeEach(async () => {
    await UserAchievement.syncIndexes();
  });

  const validUserAchievement = {
    userId: new mongoose.Types.ObjectId(),
    achievementKey: 'test_ach',
  } as const;

  // --- Valid creation ---
  it('should create a valid UserAchievement', async () => {
    const ua = await UserAchievement.create(validUserAchievement);

    expect(ua._id).toBeDefined();
    expect(String(ua.userId)).toBe(String(validUserAchievement.userId));
    expect(ua.achievementKey).toBe(validUserAchievement.achievementKey);
  });

  // --- Unique compound index: userId + achievementKey ---
  it('should enforce unique compound index on userId + achievementKey', async () => {
    await UserAchievement.create(validUserAchievement);
    await expect(UserAchievement.create(validUserAchievement)).rejects.toThrow(/duplicate key/);
  });

  it('should allow same achievementKey for different users', async () => {
    await UserAchievement.create(validUserAchievement);

    const ua = await UserAchievement.create({
      userId: new mongoose.Types.ObjectId(),
      achievementKey: validUserAchievement.achievementKey,
    });
    expect(ua._id).toBeDefined();
  });

  it('should allow different achievementKeys for same user', async () => {
    await UserAchievement.create(validUserAchievement);

    const ua = await UserAchievement.create({
      userId: validUserAchievement.userId,
      achievementKey: 'other_ach',
    });
    expect(ua._id).toBeDefined();
  });

  // --- Progress defaults to 0 ---
  it('should default progress to 0', async () => {
    const ua = await UserAchievement.create(validUserAchievement);
    expect(ua.progress).toBe(0);
  });

  it('should allow explicit progress value', async () => {
    const ua = await UserAchievement.create({ ...validUserAchievement, progress: 42 });
    expect(ua.progress).toBe(42);
  });

  // --- unlockedAt defaults to null ---
  it('should default unlockedAt to null', async () => {
    const ua = await UserAchievement.create(validUserAchievement);
    expect(ua.unlockedAt).toBeNull();
  });

  it('should allow setting unlockedAt to a Date', async () => {
    const now = new Date();
    const ua = await UserAchievement.create({ ...validUserAchievement, unlockedAt: now });
    expect(ua.unlockedAt).toEqual(now);
  });

  // --- Required fields ---
  it('should require userId', async () => {
    const { userId: _userId, ...data } = validUserAchievement;

    await expect(UserAchievement.create(data)).rejects.toThrow(/userId/);
  });

  it('should require achievementKey', async () => {
    const { achievementKey: _achievementKey, ...data } = validUserAchievement;

    await expect(UserAchievement.create(data)).rejects.toThrow(/achievementKey/);
  });

  // --- Timestamps ---
  it('should auto-generate timestamps', async () => {
    const ua = await UserAchievement.create(validUserAchievement);

    expect(ua.get('createdAt')).toBeInstanceOf(Date);
    expect(ua.get('updatedAt')).toBeInstanceOf(Date);
  });
});
