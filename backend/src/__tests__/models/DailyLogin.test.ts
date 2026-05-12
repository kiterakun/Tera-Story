import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { DailyLogin } from '../../models/DailyLogin';

const createValidDailyLoginData = () => ({
  userId: new mongoose.Types.ObjectId(),
  date: '2026-05-12',
  streak: 1,
  claimedAt: new Date(),
  reward: {
    xp: 25,
    bonusClaimed: false,
  },
});

describe('DailyLogin Model', () => {
  beforeEach(async () => {
    await DailyLogin.syncIndexes();
  });

  it('should create a valid DailyLogin with all fields', async () => {
    const data = createValidDailyLoginData();
    const doc = await DailyLogin.create(data);

    expect(doc._id).toBeDefined();
    expect(String(doc.userId)).toBe(String(data.userId));
    expect(doc.date).toBe(data.date);
    expect(doc.streak).toBe(data.streak);
    expect(doc.claimedAt.toISOString()).toBe(data.claimedAt.toISOString());
    expect(doc.reward.xp).toBe(data.reward.xp);
    expect(doc.reward.bonusClaimed).toBe(false);
  });

  const requiredFields = ['userId', 'date', 'streak', 'reward'] as const;

  it.each(requiredFields)('should require %s', async (field) => {
    const data = createValidDailyLoginData();
    delete (data as Record<string, unknown>)[field];

    await expect(DailyLogin.create(data)).rejects.toThrow();
  });

  it('should enforce unique userId + date', async () => {
    const data = createValidDailyLoginData();
    await DailyLogin.create(data);
    await expect(DailyLogin.create(data)).rejects.toThrow(/duplicate key/);
  });

  it('should allow bonus field in reward', async () => {
    const data = {
      ...createValidDailyLoginData(),
      reward: { xp: 25, bonus: 'double_xp', bonusClaimed: false },
    };
    const doc = await DailyLogin.create(data);

    expect(doc.reward.bonus).toBe('double_xp');
  });
});
