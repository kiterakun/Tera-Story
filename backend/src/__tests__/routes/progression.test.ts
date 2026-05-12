import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { xpRequiredForLevel } from '../../services/progressionService';

describe('Progression routes', () => {
  beforeEach(() => {
    // setup.ts cleans database after each test
  });

  // ─── GET /api/user/progress ────────────────────────────────────────

  describe('GET /api/user/progress', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user/progress');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns initial state for a new user (xp:0, level:1)', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.get('/api/user/progress');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const data = res.body.data;
      expect(data.xp).toBe(0);
      expect(data.level).toBe(1);
      expect(data.xpToNextLevel).toBe(xpRequiredForLevel(1));
      expect(data.xpProgress).toBe(0);
      expect(data.levelTitle).toBe('Người Mới');
      expect(data.totalScenesCompleted).toBe(0);
      expect(data.totalChoicesMade).toBe(0);
      expect(data.totalCombatWon).toBe(0);
      expect(data.totalPlaythroughsCompleted).toBe(0);
      expect(data.totalAchievementsUnlocked).toBe(0);
      expect(Array.isArray(data.recentXpHistory)).toBe(true);
      expect(data.recentXpHistory).toHaveLength(0);
    });

    it('reflects updated XP and level after awarding XP', async () => {
      const agent = await registerAndGetAgent();

      await agent.post('/api/user/xp').send({
        amount: 60,
        source: 'scene_complete',
      });
      await agent.post('/api/user/xp').send({
        amount: 40,
        source: 'combat_win',
      });

      const res = await agent.get('/api/user/progress');

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.xp).toBe(100);
      expect(data.level).toBe(2);
      expect(data.xpToNextLevel).toBe(xpRequiredForLevel(2));
      expect(data.xpProgress).toBe(0); // no XP progress into level 2 since exactly at boundary
      expect(data.levelTitle).toBe('Người Mới'); // title for level 2: highest title at or below 2 is still level 1's
      expect(data.totalScenesCompleted).toBe(1);
      expect(data.totalCombatWon).toBe(1);
      expect(data.recentXpHistory).toHaveLength(2);
    });
  });

  // ─── POST /api/user/xp ─────────────────────────────────────────────

  describe('POST /api/user/xp', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/user/xp')
        .send({ amount: 10, source: 'scene_complete' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('adds XP and returns updated stats (no level-up)', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: 50,
        source: 'scene_complete',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const data = res.body.data;
      expect(data.xp).toBe(50);
      expect(data.level).toBe(1);
      expect(data.leveledUp).toBe(false);
      expect(data.newLevel).toBeUndefined();
      expect(data.xpToNextLevel).toBe(xpRequiredForLevel(1));
      expect(data.xpProgress).toBeGreaterThan(0);
    });

    it('triggers level-up when total XP >= threshold', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: 100,
        source: 'combat_win',
      });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.xp).toBe(100);
      expect(data.level).toBe(2);
      expect(data.leveledUp).toBe(true);
      expect(data.newLevel).toBe(2);
      expect(data.xpToNextLevel).toBe(xpRequiredForLevel(2));
    });

    it('accumulates XP across multiple awards and eventually triggers level-up', async () => {
      const agent = await registerAndGetAgent();

      // Award 1: 30 XP
      const res1 = await agent.post('/api/user/xp').send({
        amount: 30,
        source: 'choice_made',
      });
      expect(res1.body.data.xp).toBe(30);
      expect(res1.body.data.level).toBe(1);
      expect(res1.body.data.leveledUp).toBe(false);

      // Award 2: 30 XP → 60 total
      const res2 = await agent.post('/api/user/xp').send({
        amount: 30,
        source: 'choice_made',
      });
      expect(res2.body.data.xp).toBe(60);
      expect(res2.body.data.level).toBe(1);
      expect(res2.body.data.leveledUp).toBe(false);

      // Award 3: 40 XP → 100 total (triggers level 2)
      const res3 = await agent.post('/api/user/xp').send({
        amount: 40,
        source: 'choice_made',
      });
      expect(res3.body.data.xp).toBe(100);
      expect(res3.body.data.level).toBe(2);
      expect(res3.body.data.leveledUp).toBe(true);
      expect(res3.body.data.newLevel).toBe(2);
    });

    it('chains multiple level-ups when XP crosses several thresholds', async () => {
      const agent = await registerAndGetAgent();

      // Award enough XP to go from level 1 to level 3 directly
      // totalXpForLevel(3) = xpRequiredForLevel(1) + xpRequiredForLevel(2)
      //   = 100 + 110 = 210
      const res = await agent.post('/api/user/xp').send({
        amount: 210,
        source: 'playthrough_complete',
      });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.xp).toBe(210);
      expect(data.level).toBe(3);
      expect(data.leveledUp).toBe(true);
      expect(data.newLevel).toBe(3);
    });

    it('accepts and stores metadata fields', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: 20,
        source: 'combat_win',
        metadata: {
          playthroughId: '507f1f77bcf86cd799439011',
          sceneId: '507f1f77bcf86cd799439022',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.xp).toBe(20);
    });

    it('increments corresponding stat counters', async () => {
      const agent = await registerAndGetAgent();

      // scene_complete → totalScenesCompleted
      await agent.post('/api/user/xp').send({
        amount: 10,
        source: 'scene_complete',
      });
      // combat_win → totalCombatWon
      await agent.post('/api/user/xp').send({
        amount: 20,
        source: 'combat_win',
      });
      // playthrough_complete → totalPlaythroughsCompleted
      await agent.post('/api/user/xp').send({
        amount: 50,
        source: 'playthrough_complete',
      });

      const progress = await agent.get('/api/user/progress');
      const data = progress.body.data;
      expect(data.totalScenesCompleted).toBe(1);
      expect(data.totalCombatWon).toBe(1);
      expect(data.totalPlaythroughsCompleted).toBe(1);
    });

    // ─── Validation errors ───────────────────────────────────────────

    it('returns 400 when amount is negative', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: -5,
        source: 'scene_complete',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('returns 400 when amount is zero', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: 0,
        source: 'scene_complete',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 400 when amount is missing', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        source: 'scene_complete',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 400 when source is invalid', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: 10,
        source: 'invalid_source',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 400 when source is missing', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: 10,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 400 for empty body', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 400 when amount is a string instead of number', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.post('/api/user/xp').send({
        amount: 'fifty',
        source: 'scene_complete',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    // ─── Edge case: user not found ───────────────────────────────────

    it('returns 404 when user no longer exists', async () => {
      const agent = await registerAndGetAgent({
        username: 'ghostuser',
        email: 'ghost@example.com',
      });

      // Delete the user from the database directly
      await User.findOneAndDelete({ email: 'ghost@example.com' });

      const res = await agent.post('/api/user/xp').send({
        amount: 10,
        source: 'scene_complete',
      });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User not found');
    });
  });

  // ─── GET /api/user/level-history ───────────────────────────────────

  describe('GET /api/user/level-history', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user/level-history');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('returns empty array when no level-ups have occurred', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.get('/api/user/level-history');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.history).toEqual([]);
    });

    it('returns level-up entries after a level-up', async () => {
      const agent = await registerAndGetAgent();

      // Trigger level-up to level 2
      await agent.post('/api/user/xp').send({
        amount: 100,
        source: 'combat_win',
      });

      const res = await agent.get('/api/user/level-history');

      expect(res.status).toBe(200);
      const history = res.body.data.history;
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        level: 2,
      });
      expect(history[0].totalXpAtTime).toBeGreaterThanOrEqual(100);
      expect(history[0].reachedAt).toBeDefined();
    });

    it('returns multiple entries for multiple level-ups', async () => {
      const agent = await registerAndGetAgent();

      // Trigger level 2 (need 100 XP)
      await agent.post('/api/user/xp').send({
        amount: 100,
        source: 'combat_win',
      });
      // Trigger level 3 (need 210 total)
      await agent.post('/api/user/xp').send({
        amount: 110,
        source: 'combat_win',
      });

      const res = await agent.get('/api/user/level-history');

      expect(res.status).toBe(200);
      const history = res.body.data.history;
      expect(history.length).toBeGreaterThanOrEqual(2);
      const levels = history.map((h: { level: number }) => h.level);
      expect(levels).toContain(2);
      expect(levels).toContain(3);
    });

    it('respects limit query parameter', async () => {
      const agent = await registerAndGetAgent();

      // Trigger level-ups: 2, 3, 4
      // level 2: 100 XP, level 3: 210 total, level 4: 331 total
      await agent.post('/api/user/xp').send({
        amount: 100,
        source: 'combat_win',
      });
      await agent.post('/api/user/xp').send({
        amount: 110,
        source: 'combat_win',
      });
      await agent.post('/api/user/xp').send({
        amount: 121,
        source: 'combat_win',
      });

      // Default limit (20) should return all
      const resDefault = await agent.get('/api/user/level-history');
      expect(resDefault.body.data.history.length).toBeGreaterThanOrEqual(2);

      // Limit 1 should return only the most recent
      const resLimited = await agent.get('/api/user/level-history?limit=1');
      expect(resLimited.status).toBe(200);
      expect(resLimited.body.data.history).toHaveLength(1);
    });

    it('clamps limit to 100 max and 1 min', async () => {
      const agent = await registerAndGetAgent();

      // Trigger one level-up
      await agent.post('/api/user/xp').send({
        amount: 100,
        source: 'combat_win',
      });

      // limit=0 should be clamped to 1
      const resMin = await agent.get('/api/user/level-history?limit=0');
      expect(resMin.status).toBe(200);
      expect(resMin.body.data.history.length).toBeLessThanOrEqual(1);

      // limit=999 should be clamped to 100
      const resMax = await agent.get('/api/user/level-history?limit=999');
      expect(resMax.status).toBe(200);
      expect(resMax.body.data.history.length).toBeLessThanOrEqual(100);
    });
  });

  // ─── GET /api/user/xp-reference ────────────────────────────────────

  describe('GET /api/user/xp-reference', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user/xp-reference');

      expect(res.status).toBe(401);
    });

    it('returns rewards, titles, and level curve', async () => {
      const agent = await registerAndGetAgent();

      const res = await agent.get('/api/user/xp-reference');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const data = res.body.data;
      expect(data.rewards).toBeDefined();
      expect(data.rewards.scene_complete).toBe(10);
      expect(data.rewards.combat_win).toBe(20);
      expect(data.titles).toBeDefined();
      expect(data.titles['1']).toBe('Người Mới');
      expect(data.levelCurve).toBeDefined();
      expect(data.levelCurve).toHaveLength(10);
      expect(data.levelCurve[0]).toMatchObject({
        level: 1,
        xpToNext: xpRequiredForLevel(1),
      });
    });
  });

  // ─── Cross-route consistency ───────────────────────────────────────

  describe('cross-route consistency', () => {
    it('progress reflects all XP awards and level changes', async () => {
      const agent = await registerAndGetAgent();

      // Award XP across different sources
      await agent.post('/api/user/xp').send({
        amount: 50,
        source: 'scene_complete',
      });
      await agent.post('/api/user/xp').send({
        amount: 30,
        source: 'choice_made',
      });
      await agent.post('/api/user/xp').send({
        amount: 40,
        source: 'combat_win',
      });
      // Total: 120 XP, level should be 2 (threshold 100)
      // xpProgress into level 2: (120 - 100) / 110 ≈ 18%

      const progress = await agent.get('/api/user/progress');
      expect(progress.body.data.xp).toBe(120);
      expect(progress.body.data.level).toBe(2);
      expect(progress.body.data.totalScenesCompleted).toBe(1);
      expect(progress.body.data.totalChoicesMade).toBe(1);
      expect(progress.body.data.totalCombatWon).toBe(1);
      expect(progress.body.data.recentXpHistory).toHaveLength(3);
      expect(progress.body.data.xpProgress).toBeGreaterThan(0);

      const history = await agent.get('/api/user/level-history');
      const historyEntries = history.body.data.history;
      expect(historyEntries.length).toBeGreaterThanOrEqual(1);
      expect(historyEntries[0].level).toBe(2);
    });
  });
});
