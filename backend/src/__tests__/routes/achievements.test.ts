import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { Achievement } from '../../models/Achievement';
import { UserAchievement } from '../../models/UserAchievement';
import { User } from '../../models/User';

const achievementsPath = '/api/achievements';

describe('Achievements routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await Achievement.syncIndexes();
    await UserAchievement.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({
      username: 'achievement-user',
      email: 'achievement-user@test.com',
      password: 'password123',
    });

    const user = await User.findOne({ email: 'achievement-user@test.com' }).orFail();
    userId = String(user._id);

    await Achievement.create([
      {
        key: 'first_steps',
        name: { en: 'First Steps', vi: 'Buoc Dau' },
        description: { en: 'Complete first scene', vi: 'Hoan thanh canh dau tien' },
        icon: 'star',
        category: 'milestone',
        rarity: 'common',
        hidden: false,
        unlockCriteria: { type: 'count', field: 'totalScenesCompleted', threshold: 1 },
        xpReward: 50,
        sortOrder: 1,
      },
      {
        key: 'warrior_spirit',
        name: { en: 'Warrior Spirit', vi: 'Tinh Than Chien Binh' },
        description: { en: 'Win 10 combats', vi: 'Thang 10 tran' },
        icon: 'sword',
        category: 'combat',
        rarity: 'uncommon',
        hidden: false,
        unlockCriteria: { type: 'count', field: 'totalCombatWon', threshold: 10 },
        xpReward: 100,
        sortOrder: 2,
      },
      {
        key: 'legendary_secret',
        name: { en: 'Legendary Secret', vi: 'Bi Mat Huyen Thoai' },
        description: { en: 'Discover a legendary secret', vi: 'Kham pha bi mat huyen thoai' },
        icon: 'gem',
        category: 'hidden',
        rarity: 'epic',
        hidden: true,
        unlockCriteria: { type: 'specific_action', condition: 'ancient_gate_opened' },
        xpReward: 250,
        sortOrder: 3,
      },
    ]);
  });

  async function seedUserAchievements() {
    const now = new Date();
    await UserAchievement.create([
      {
        userId,
        achievementKey: 'first_steps',
        progress: 1,
        unlockedAt: now,
      },
      {
        userId,
        achievementKey: 'warrior_spirit',
        progress: 4,
        unlockedAt: null,
      },
      {
        userId,
        achievementKey: 'legendary_secret',
        progress: 0,
        unlockedAt: null,
      },
    ]);
    return { unlockedAt: now };
  }

  describe('GET /api/achievements', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get(achievementsPath);

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns all achievements with user progress', async () => {
      await seedUserAchievements();

      const res = await agent.get(achievementsPath);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.achievements).toHaveLength(3);
      expect(res.body.data.stats).toMatchObject({
        total: 3,
        unlocked: 1,
        percentComplete: 33,
      });
      expect(res.body.data.achievements.map((achievement: { key: string }) => achievement.key)).toEqual([
        'first_steps',
        'warrior_spirit',
        'legendary_secret',
      ]);
      expect(res.body.data.achievements[0]).toMatchObject({
        key: 'first_steps',
        unlocked: true,
        progress: 1,
      });
      expect(res.body.data.achievements[1]).toMatchObject({
        key: 'warrior_spirit',
        unlocked: false,
        progress: 4,
      });
    });

    it('filters by category=combat', async () => {
      await seedUserAchievements();

      const res = await agent.get(`${achievementsPath}?category=combat`);

      expect(res.status).toBe(200);
      expect(res.body.data.achievements).toHaveLength(1);
      expect(res.body.data.achievements[0]).toMatchObject({
        key: 'warrior_spirit',
        category: 'combat',
      });
      expect(res.body.data.stats.total).toBe(1);
    });

    it('filters by rarity=epic', async () => {
      await seedUserAchievements();

      const res = await agent.get(`${achievementsPath}?rarity=epic`);

      expect(res.status).toBe(200);
      expect(res.body.data.achievements).toHaveLength(1);
      expect(res.body.data.achievements[0]).toMatchObject({
        key: 'legendary_secret',
        rarity: 'epic',
      });
      expect(res.body.data.stats.total).toBe(1);
    });

    it('filters by status=unlocked', async () => {
      await seedUserAchievements();

      const res = await agent.get(`${achievementsPath}?status=unlocked`);

      expect(res.status).toBe(200);
      expect(res.body.data.achievements).toHaveLength(1);
      expect(res.body.data.achievements[0]).toMatchObject({
        key: 'first_steps',
        unlocked: true,
      });
      expect(res.body.data.stats).toMatchObject({ total: 3, unlocked: 1 });
    });
  });

  describe('GET /api/achievements/recent', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get(`${achievementsPath}/recent`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns recent unlocks', async () => {
      await UserAchievement.create([
        {
          userId,
          achievementKey: 'first_steps',
          progress: 1,
          unlockedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          userId,
          achievementKey: 'legendary_secret',
          progress: 1,
          unlockedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ]);

      const res = await agent.get(`${achievementsPath}/recent`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.recent).toHaveLength(2);
      expect(res.body.data.recent[0]).toMatchObject({
        achievementKey: 'legendary_secret',
        achievement: { key: 'legendary_secret', rarity: 'epic' },
      });
      expect(res.body.data.recent[1]).toMatchObject({
        achievementKey: 'first_steps',
        achievement: { key: 'first_steps', rarity: 'common' },
      });
    });

    it('returns empty when none unlocked', async () => {
      await UserAchievement.create({
        userId,
        achievementKey: 'warrior_spirit',
        progress: 4,
        unlockedAt: null,
      });

      const res = await agent.get(`${achievementsPath}/recent`);

      expect(res.status).toBe(200);
      expect(res.body.data.recent).toEqual([]);
    });
  });

  describe('GET /api/achievements/:key', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get(`${achievementsPath}/first_steps`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns achievement with progress', async () => {
      await seedUserAchievements();

      const res = await agent.get(`${achievementsPath}/warrior_spirit`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.achievement).toMatchObject({
        key: 'warrior_spirit',
        category: 'combat',
        rarity: 'uncommon',
      });
      expect(res.body.data.userProgress).toMatchObject({
        unlocked: false,
        unlockedAt: null,
        progress: 4,
      });
    });

    it('returns 404 for nonexistent key', async () => {
      const res = await agent.get(`${achievementsPath}/missing_achievement`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        status: 'error',
        message: 'Achievement not found',
      });
    });
  });

  describe('POST /api/achievements/check', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`${achievementsPath}/check`)
        .send({ userId, event: { type: 'scene_completed' } });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('triggers unlock when criteria met', async () => {
      await User.updateOne({ _id: userId }, { $set: { totalScenesCompleted: 1 } });

      const res = await agent
        .post(`${achievementsPath}/check`)
        .send({ userId, event: { type: 'scene_completed' } });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.unlocked).toEqual([
        expect.objectContaining({ key: 'first_steps', xpReward: 50 }),
      ]);
      expect(res.body.data.progressUpdated).toContain('first_steps');

      const progress = await UserAchievement.findOne({ userId, achievementKey: 'first_steps' }).lean();
      expect(progress?.unlockedAt).toBeInstanceOf(Date);
    });

    it('returns progressUpdated for count-based achievements', async () => {
      await Achievement.create({
        key: 'warrior',
        name: { en: 'Warrior', vi: 'Chien Binh' },
        description: { en: 'Win 10 combats', vi: 'Thang 10 tran' },
        icon: 'sword',
        category: 'combat',
        rarity: 'uncommon',
        hidden: false,
        unlockCriteria: { type: 'count', field: 'totalCombatWon', threshold: 10 },
        xpReward: 100,
        sortOrder: 4,
      });
      await User.updateOne({ _id: userId }, { $set: { totalCombatWon: 4 } });

      const res = await agent
        .post(`${achievementsPath}/check`)
        .send({ userId, event: { type: 'combat_won' } });

      expect(res.status).toBe(200);
      expect(res.body.data.unlocked).toEqual([]);
      expect(res.body.data.progressUpdated).toContain('warrior');

      const progress = await UserAchievement.findOne({ userId, achievementKey: 'warrior' }).lean();
      expect(progress?.progress).toBe(4);
      expect(progress?.unlockedAt).toBeNull();
    });

    it('returns 400 for invalid event type', async () => {
      const res = await agent
        .post(`${achievementsPath}/check`)
        .send({ userId, event: { type: 'invalid_event' } });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });

    it('returns 400 for missing userId', async () => {
      const res = await agent
        .post(`${achievementsPath}/check`)
        .send({ event: { type: 'scene_completed' } });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });
  });
});
