import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Character } from '../../models/Character';
import { SpecialItem } from '../../models/SpecialItem';

describe('Special Item routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  async function createScenario(email = 'spitems@test.com') {
    const agent = await registerAndGetAgent({ username: email.split('@')[0], email });
    const user = await User.findOne({ email }).orFail();
    const world = await World.create({ name: 'TestWorld', description: 'desc', genre: 'fantasy', userId: user._id });
    const playthrough = await Playthrough.create({ name: 'PT', worldId: world._id, userId: user._id });
    const character = await Character.create({ name: 'Hero', role: 'protagonist', playthroughId: playthrough._id, worldId: world._id, userId: user._id });
    return { agent, user, world, playthrough, character };
  }

  describe('GET /api/playthroughs/:playthroughId/special-items', () => {
    it('returns special items for playthrough', async () => {
      const { agent, playthrough } = await createScenario();
      await SpecialItem.create({ name: 'Excalibur', category: 'weapon', playthroughId: playthrough._id });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/special-items`);

      expect(res.status).toBe(200);
      expect(res.body.specialItems).toHaveLength(1);
      expect(res.body.specialItems[0].name).toBe('Excalibur');
    });

    it('filters by category query param', async () => {
      const { agent, playthrough } = await createScenario();
      await SpecialItem.create({ name: 'Excalibur', category: 'weapon', playthroughId: playthrough._id });
      await SpecialItem.create({ name: 'Potion', category: 'consumable', playthroughId: playthrough._id });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/special-items?category=weapon`);

      expect(res.status).toBe(200);
      expect(res.body.specialItems).toHaveLength(1);
      expect(res.body.specialItems[0].name).toBe('Excalibur');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/special-items`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent playthrough', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/special-items`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Playthrough not found');
    });

    it('returns 403 for another user playthrough', async () => {
      const { playthrough } = await createScenario('owner-spitems@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'otherspitems', email: 'other-spitems@test.com' });

      const res = await otherAgent.get(`/api/playthroughs/${playthrough._id}/special-items`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/special-items/:id', () => {
    it('returns single special item', async () => {
      const { agent, playthrough } = await createScenario();
      const si = await SpecialItem.create({ name: 'Amulet', category: 'accessory', playthroughId: playthrough._id });

      const res = await agent.get(`/api/special-items/${si._id}`);

      expect(res.status).toBe(200);
      expect(res.body.specialItem.name).toBe('Amulet');
    });

    it('returns 404 for non-existent item', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/special-items/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Special item not found');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/special-items/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/playthroughs/:playthroughId/special-items/by-owner/:characterId', () => {
    it('returns special items owned by character', async () => {
      const { agent, playthrough, character } = await createScenario();
      await SpecialItem.create({ name: 'Ring', category: 'accessory', playthroughId: playthrough._id, ownerId: character._id });
      await SpecialItem.create({ name: 'Scroll', category: 'consumable', playthroughId: playthrough._id });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/special-items/by-owner/${character._id}`);

      expect(res.status).toBe(200);
      expect(res.body.specialItems).toHaveLength(1);
      expect(res.body.specialItems[0].name).toBe('Ring');
    });

    it('returns 403 for another user playthrough', async () => {
      const { playthrough, character } = await createScenario('owner-spitems2@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'otherspitems2', email: 'other-spitems2@test.com' });

      const res = await otherAgent.get(`/api/playthroughs/${playthrough._id}/special-items/by-owner/${character._id}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent playthrough', async () => {
      const { agent, character } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/special-items/by-owner/${character._id}`);

      expect(res.status).toBe(404);
    });
  });
});
