import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { WhispersCache } from '../../models/WhispersCache';

describe('Whispers routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  // --- Scenario helpers ---

  async function createScenario(email = 'whispers@test.com') {
    const username = email.split('@')[0]!;
    const agent = await registerAndGetAgent({ username, email });
    const user = await User.findOne({ email }).orFail();
    const world = await World.create({
      name: 'WhisperWorld',
      description: 'A world of murmurs',
      genre: 'fantasy',
      userId: user._id,
    });
    const playthrough = await Playthrough.create({
      name: 'WhisperPT',
      worldId: world._id,
      userId: user._id,
    });
    return { agent, user, world, playthrough };
  }

  function makeWhispers(count: 3 | 4 | 5) {
    const templates = [
      {
        type: 'rumor' as const,
        content: 'The village whispers of an ancient dragon waking in the northern peaks. Travelers speak of strange lights at dusk near the old watchtower.',
        attribution: 'Village Elder',
      },
      {
        type: 'letter' as const,
        content: 'Dearest friend, I have arrived safely at the capital. The journey was long but the roads are clear this season. I shall write again soon.',
        attribution: 'Merchant',
      },
      {
        type: 'news' as const,
        content: 'The Royal Council has announced new trade agreements with the Eastern Kingdoms. Merchants celebrate in the streets this morning.',
        attribution: 'Town Crier',
      },
      {
        type: 'diary' as const,
        content: 'Day 47: The expedition has turned back. Supplies are running low and morale is even lower. I fear we may never find what we seek.',
        attribution: 'Explorer',
      },
      {
        type: 'rumor' as const,
        content: 'A shadowy figure was seen near the old crypt last night. The guards found nothing but the townsfolk are frightened nonetheless.',
        attribution: 'Watchman',
      },
    ];
    return templates.slice(0, count);
  }

  async function createCache(
    playthroughId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    options?: { generatedAt?: Date; viewedAt?: Date | null },
  ) {
    const generatedAt = options?.generatedAt ?? new Date();
    return WhispersCache.create({
      playthroughId,
      userId,
      whispers: makeWhispers(3),
      generatedAt,
      expiresAt: new Date(generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      viewedAt: options?.viewedAt ?? null,
    });
  }

  // ====================================================================
  // GET /api/playthroughs/:playthroughId/whispers
  // ====================================================================

  describe('GET /api/playthroughs/:playthroughId/whispers', () => {
    it('returns 401 without auth', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/playthroughs/${fakeId}/whispers`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for nonexistent playthrough', async () => {
      const { agent } = await createScenario('whispers-404-get@test.com');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await agent.get(`/api/playthroughs/${fakeId}/whispers`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Playthrough not found');
    });

    it('returns 403 for different user\'s playthrough', async () => {
      const { playthrough } = await createScenario('whispers-403a-get@test.com');
      const { agent: otherAgent } = await createScenario('whispers-403b-get@test.com');

      const res = await otherAgent.get(`/api/playthroughs/${playthrough._id}/whispers`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });

    it('returns empty whispers when recently active (< 24h)', async () => {
      const { agent, playthrough } = await createScenario('whispers-recent@test.com');
      // lastActiveAt defaults to Date.now(), which is < 24h ago

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/whispers`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual({
        playthroughId: playthrough._id.toString(),
        whispers: [],
        daysAway: 0,
        hasNew: false,
      });
      expect(res.body.message).toBe('User was active recently, no whispers needed');
    });

    it('returns cached whispers when inactive (> 24h) and valid cache exists', async () => {
      const { agent, user, playthrough } = await createScenario('whispers-cached@test.com');

      // Set playthrough inactive 48 hours ago
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await Playthrough.findByIdAndUpdate(playthrough._id, { lastActiveAt: twoDaysAgo });

      // Create valid cache (generated just now, expires in 7 days)
      await createCache(playthrough._id, user._id, {
        generatedAt: new Date(),
        viewedAt: null,
      });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/whispers`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.playthroughId).toBe(playthrough._id.toString());
      expect(res.body.data.whispers).toHaveLength(3);
      expect(res.body.data.whispers[0]).toMatchObject({
        type: 'rumor',
        content: expect.any(String),
      });
      expect(res.body.data.daysAway).toBe(2);
      expect(res.body.data.generatedAt).toBeDefined();
      expect(res.body.data.hasNew).toBe(true); // not viewed
    });

    it('returns hasNew=false when cache exists and already viewed', async () => {
      const { agent, user, playthrough } = await createScenario('whispers-viewed@test.com');

      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await Playthrough.findByIdAndUpdate(playthrough._id, { lastActiveAt: twoDaysAgo });

      await createCache(playthrough._id, user._id, {
        generatedAt: new Date(),
        viewedAt: new Date(),
      });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/whispers`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasNew).toBe(false);
    });

    it('returns empty with needsGeneration when inactive and cache is expired', async () => {
      const { agent, user, playthrough } = await createScenario('whispers-expired@test.com');

      // Inactive for 48 hours
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await Playthrough.findByIdAndUpdate(playthrough._id, { lastActiveAt: twoDaysAgo });

      // Create cache generated 10 days ago → expiresAt = 3 days ago (expired)
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await createCache(playthrough._id, user._id, {
        generatedAt: tenDaysAgo,
        viewedAt: null,
      });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/whispers`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual({
        playthroughId: playthrough._id.toString(),
        whispers: [],
        daysAway: 2,
        hasNew: false,
        needsGeneration: true,
      });
      expect(res.body.message).toBe('Whispers need AI generation — pending integration');
    });

    it('bypasses recent-activity check with forceRegenerate=true', async () => {
      const { agent, user, playthrough } = await createScenario('whispers-force-recent@test.com');
      // lastActiveAt defaults to now → < 24h → normally returns empty

      // Also create valid cache — should be ignored when forceRegenerate=true
      await createCache(playthrough._id, user._id, {
        generatedAt: new Date(),
        viewedAt: null,
      });

      const res = await agent.get(
        `/api/playthroughs/${playthrough._id}/whispers?forceRegenerate=true`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.whispers).toEqual([]);
      expect(res.body.data.hasNew).toBe(false);
      expect(res.body.data.needsGeneration).toBe(true);
      // Cache fields should NOT leak through
      expect(res.body.data.generatedAt).toBeUndefined();
    });

    it('bypasses cache with forceRegenerate=true when inactive', async () => {
      const { agent, user, playthrough } = await createScenario('whispers-force-inactive@test.com');

      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await Playthrough.findByIdAndUpdate(playthrough._id, { lastActiveAt: twoDaysAgo });

      // Valid cache that should be ignored
      await createCache(playthrough._id, user._id, {
        generatedAt: new Date(),
        viewedAt: null,
      });

      const res = await agent.get(
        `/api/playthroughs/${playthrough._id}/whispers?forceRegenerate=true`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.needsGeneration).toBe(true);
      expect(res.body.data.generatedAt).toBeUndefined();
    });
  });

  // ====================================================================
  // POST /api/playthroughs/:playthroughId/whispers/mark-viewed
  // ====================================================================

  describe('POST /api/playthroughs/:playthroughId/whispers/mark-viewed', () => {
    it('sets viewedAt on cache and playthrough', async () => {
      const { agent, user, playthrough } = await createScenario('whispers-mark@test.com');

      await createCache(playthrough._id, user._id, {
        generatedAt: new Date(),
        viewedAt: null,
      });

      const res = await agent.post(
        `/api/playthroughs/${playthrough._id}/whispers/mark-viewed`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Whispers marked as viewed');

      // Verify cache viewedAt updated
      const updatedCache = await WhispersCache.findOne({ playthroughId: playthrough._id });
      expect(updatedCache).not.toBeNull();
      expect(updatedCache!.viewedAt).toBeInstanceOf(Date);

      // Verify playthrough lastWhispersViewedAt updated
      const updatedPT = await Playthrough.findById(playthrough._id);
      expect(updatedPT).not.toBeNull();
      expect(updatedPT!.lastWhispersViewedAt).toBeInstanceOf(Date);
    });

    it('succeeds even when no cache exists (no-op update)', async () => {
      const { agent, playthrough } = await createScenario('whispers-mark-nocache@test.com');

      const res = await agent.post(
        `/api/playthroughs/${playthrough._id}/whispers/mark-viewed`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Playthrough should still have its timestamp updated
      const updatedPT = await Playthrough.findById(playthrough._id);
      expect(updatedPT!.lastWhispersViewedAt).toBeInstanceOf(Date);
    });

    it('returns 401 without auth', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).post(
        `/api/playthroughs/${fakeId}/whispers/mark-viewed`,
      );

      expect(res.status).toBe(401);
    });

    it('returns 404 for nonexistent playthrough', async () => {
      const { agent } = await createScenario('whispers-mark-404@test.com');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await agent.post(
        `/api/playthroughs/${fakeId}/whispers/mark-viewed`,
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Playthrough not found');
    });

    it('returns 403 for different user\'s playthrough', async () => {
      const { playthrough } = await createScenario('whispers-mark-403a@test.com');
      const { agent: otherAgent } = await createScenario('whispers-mark-403b@test.com');

      const res = await otherAgent.post(
        `/api/playthroughs/${playthrough._id}/whispers/mark-viewed`,
      );

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Access denied');
    });
  });
});
