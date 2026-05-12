import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { StoryCard } from '../../models/StoryCard';
import { World } from '../../models/World';
import { User } from '../../models/User';

const galleryPath = '/api/gallery';

describe('Gallery routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: mongoose.Types.ObjectId;
  let otherUserId: mongoose.Types.ObjectId;
  let worldId: mongoose.Types.ObjectId;
  let otherWorldId: mongoose.Types.ObjectId;
  let commonCardId: string;
  let rareCardId: string;
  let epicCardId: string;
  let otherUserCardId: string;

  const createCard = async (overrides: {
    userId?: mongoose.Types.ObjectId;
    worldId?: mongoose.Types.ObjectId;
    title: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic';
    category: 'story' | 'combat' | 'character' | 'discovery' | 'milestone';
    unlockedAt: Date;
  }) => StoryCard.create({
    userId: overrides.userId ?? userId,
    playthroughId: new mongoose.Types.ObjectId(),
    worldId: overrides.worldId ?? worldId,
    sceneId: new mongoose.Types.ObjectId(),
    imageUrl: `https://example.com/${overrides.title}.png`,
    thumbnailUrl: `https://example.com/${overrides.title}-thumb.png`,
    title: overrides.title,
    description: `${overrides.title} description`,
    rarity: overrides.rarity,
    category: overrides.category,
    unlockedAt: overrides.unlockedAt,
    shared: false,
    shareCount: 0,
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({
      username: 'gallery-user',
      email: 'gallery-user@test.com',
      password: 'password123',
    });

    const user = await User.findOne({ email: 'gallery-user@test.com' }).orFail();
    const otherUser = await User.create({
      username: 'other-gallery-user',
      email: 'other-gallery-user@test.com',
      password: 'password123',
    });

    userId = user._id;
    otherUserId = otherUser._id;

    const world = await World.create({
      name: 'Gallery World',
      description: 'Primary gallery test world',
      genre: 'fantasy',
      userId,
    });
    const otherWorld = await World.create({
      name: 'Other Gallery World',
      description: 'Secondary gallery test world',
      genre: 'sci-fi',
      userId,
    });

    worldId = world._id;
    otherWorldId = otherWorld._id;

    const commonCard = await createCard({
      title: 'Common Story Card',
      rarity: 'common',
      category: 'story',
      unlockedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const rareCard = await createCard({
      title: 'Rare Combat Card',
      rarity: 'rare',
      category: 'combat',
      unlockedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const epicCard = await createCard({
      title: 'Epic Discovery Card',
      rarity: 'epic',
      category: 'discovery',
      worldId: otherWorldId,
      unlockedAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    const otherUserCard = await createCard({
      title: 'Other User Card',
      rarity: 'uncommon',
      category: 'character',
      userId: otherUserId,
      worldId: otherWorldId,
      unlockedAt: new Date('2026-01-04T00:00:00.000Z'),
    });

    commonCardId = String(commonCard._id);
    rareCardId = String(rareCard._id);
    epicCardId = String(epicCard._id);
    otherUserCardId = String(otherUserCard._id);
  });

  describe('GET /api/gallery', () => {
    it('returns paginated cards for authenticated user', async () => {
      const res = await agent.get(galleryPath);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.cards).toHaveLength(3);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.totalPages).toBe(1);
      expect(res.body.data.cards.map((card: { title: string }) => card.title)).toEqual([
        'Epic Discovery Card',
        'Rare Combat Card',
        'Common Story Card',
      ]);
      expect(res.body.data.stats).toMatchObject({
        total: 3,
        common: 1,
        uncommon: 0,
        rare: 1,
        epic: 1,
      });
    });

    it('returns empty list when authenticated user has no cards', async () => {
      const emptyAgent = await registerAndGetAgent({
        username: 'empty-gallery-user',
        email: 'empty-gallery-user@test.com',
        password: 'password123',
      });

      const res = await emptyAgent.get(galleryPath);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.cards).toEqual([]);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.totalPages).toBe(0);
      expect(res.body.data.stats).toMatchObject({
        total: 0,
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
      });
    });

    it('paginates with page and limit query params', async () => {
      const pageOne = await agent.get(galleryPath).query({ page: 1, limit: 2 });
      const pageTwo = await agent.get(galleryPath).query({ page: 2, limit: 2 });
      const pageThree = await agent.get(galleryPath).query({ page: 3, limit: 2 });

      expect(pageOne.status).toBe(200);
      expect(pageOne.body.data.cards).toHaveLength(2);
      expect(pageOne.body.data.total).toBe(3);
      expect(pageOne.body.data.page).toBe(1);
      expect(pageOne.body.data.totalPages).toBe(2);

      expect(pageTwo.status).toBe(200);
      expect(pageTwo.body.data.cards).toHaveLength(1);
      expect(pageTwo.body.data.page).toBe(2);
      expect(pageTwo.body.data.cards[0]._id).toBe(commonCardId);

      expect(pageThree.status).toBe(200);
      expect(pageThree.body.data.cards).toHaveLength(0);
      expect(pageThree.body.data.page).toBe(3);
    });

    it('filters by rarity query param', async () => {
      const res = await agent.get(galleryPath).query({ rarity: 'rare' });

      expect(res.status).toBe(200);
      expect(res.body.data.cards).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.cards[0]._id).toBe(rareCardId);
      expect(res.body.data.cards[0].rarity).toBe('rare');
    });

    it('filters by worldId query param', async () => {
      const res = await agent.get(galleryPath).query({ worldId: String(otherWorldId) });

      expect(res.status).toBe(200);
      expect(res.body.data.cards).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.cards[0]._id).toBe(epicCardId);
      expect(res.body.data.cards[0].worldId).toBe(String(otherWorldId));
    });

    it('filters by category query param', async () => {
      const res = await agent.get(galleryPath).query({ category: 'combat' });

      expect(res.status).toBe(200);
      expect(res.body.data.cards).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.cards[0]._id).toBe(rareCardId);
      expect(res.body.data.cards[0].category).toBe('combat');
    });

    it('sorts by rarity when sort=rarity', async () => {
      const res = await agent.get(galleryPath).query({ sort: 'rarity' });

      expect(res.status).toBe(200);
      expect(res.body.data.cards.map((card: { rarity: string }) => card.rarity)).toEqual([
        'rare',
        'epic',
        'common',
      ]);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(galleryPath);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gallery/stats', () => {
    it('returns stats with correct counts and recent unlocks', async () => {
      const res = await agent.get(`${galleryPath}/stats`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.totalCards).toBe(3);
      expect(res.body.data.byRarity).toEqual({
        common: 1,
        epic: 1,
        rare: 1,
      });
      expect(res.body.data.byCategory).toEqual({
        combat: 1,
        discovery: 1,
        story: 1,
      });
      expect(res.body.data.recentUnlock).toHaveLength(3);
      expect(res.body.data.recentUnlock.map((card: { title: string }) => card.title)).toEqual([
        'Epic Discovery Card',
        'Rare Combat Card',
        'Common Story Card',
      ]);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`${galleryPath}/stats`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/gallery/:cardId', () => {
    it('returns single card detail', async () => {
      const res = await agent.get(`${galleryPath}/${rareCardId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.card._id).toBe(rareCardId);
      expect(res.body.data.card.title).toBe('Rare Combat Card');
      expect(res.body.data.card.rarity).toBe('rare');
      expect(res.body.data.card.category).toBe('combat');
    });

    it('returns 404 for nonexistent card', async () => {
      const nonexistentCardId = new mongoose.Types.ObjectId();

      const res = await agent.get(`${galleryPath}/${nonexistentCardId}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });

    it('returns 403 for another user card', async () => {
      const res = await agent.get(`${galleryPath}/${otherUserCardId}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`${galleryPath}/${commonCardId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/gallery/:cardId/share', () => {
    it('generates public share URL for card', async () => {
      const res = await agent.post(`${galleryPath}/${commonCardId}/share`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.publicShareUrl).toEqual(expect.any(String));
      expect(res.body.data.shareCount).toBe(1);

      const card = await StoryCard.findById(commonCardId).orFail();
      expect(card.shared).toBe(true);
      expect(card.publicShareUrl).toBe(res.body.data.publicShareUrl);
      expect(card.shareCount).toBe(1);
    });

    it('returns 404 for nonexistent card', async () => {
      const nonexistentCardId = new mongoose.Types.ObjectId();

      const res = await agent.post(`${galleryPath}/${nonexistentCardId}/share`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post(`${galleryPath}/${commonCardId}/share`);

      expect(res.status).toBe(401);
    });
  });
});
