import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Item } from '../../models/Item';

describe('Item routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  async function createScenario(email = 'items@test.com') {
    const agent = await registerAndGetAgent({ username: email.split('@')[0], email });
    const user = await User.findOne({ email }).orFail();
    const world = await World.create({ name: 'TestWorld', description: 'desc', genre: 'fantasy', userId: user._id });
    const playthrough = await Playthrough.create({ name: 'PT', worldId: world._id, userId: user._id });
    return { agent, user, world, playthrough };
  }

  describe('GET /api/playthroughs/:playthroughId/items', () => {
    it('returns items for playthrough', async () => {
      const { agent, playthrough } = await createScenario();
      await Item.create({ name: 'Sword', playthroughId: playthrough._id });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/items`);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].name).toBe('Sword');
    });

    it('returns empty array when no items', async () => {
      const { agent, playthrough } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/items`);

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/items`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent playthrough', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/items`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Playthrough not found');
    });

    it('returns 403 for another user playthrough', async () => {
      const { playthrough } = await createScenario('owner-items@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'otheritems', email: 'other-items@test.com' });

      const res = await otherAgent.get(`/api/playthroughs/${playthrough._id}/items`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/items/:id', () => {
    it('returns single item', async () => {
      const { agent, playthrough } = await createScenario();
      const item = await Item.create({ name: 'Shield', playthroughId: playthrough._id });

      const res = await agent.get(`/api/items/${item._id}`);

      expect(res.status).toBe(200);
      expect(res.body.item.name).toBe('Shield');
    });

    it('returns 404 for non-existent item', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/items/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Item not found');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/items/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(401);
    });
  });
});
