import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Character } from '../../models/Character';
import { Relationship } from '../../models/Relationship';
import { ConsequenceSeed } from '../../models/ConsequenceSeed';
import { Chapter } from '../../models/Chapter';

describe('Relationship routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
    await Chapter.syncIndexes();
  });

  async function createScenario(email = 'rels@test.com') {
    const agent = await registerAndGetAgent({ username: email.split('@')[0], email });
    const user = await User.findOne({ email }).orFail();
    const world = await World.create({ name: 'TestWorld', description: 'desc', genre: 'fantasy', userId: user._id });
    const playthrough = await Playthrough.create({ name: 'PT', worldId: world._id, userId: user._id });
    const charA = await Character.create({ name: 'Alice', role: 'protagonist', playthroughId: playthrough._id, worldId: world._id, userId: user._id });
    const charB = await Character.create({ name: 'Bob', role: 'npc', playthroughId: playthrough._id, worldId: world._id, userId: user._id });
    return { agent, user, world, playthrough, charA, charB };
  }

  describe('GET /api/playthroughs/:playthroughId/relationships', () => {
    it('returns relationships for playthrough', async () => {
      const { agent, playthrough, charA, charB } = await createScenario();
      await Relationship.create({ characterA: charA._id, characterB: charB._id, type: 'ally', playthroughId: playthrough._id });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/relationships`);

      expect(res.status).toBe(200);
      expect(res.body.relationships).toHaveLength(1);
      expect(res.body.relationships[0].type).toBe('ally');
    });

    it('returns empty array when no relationships', async () => {
      const { agent, playthrough } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/relationships`);

      expect(res.status).toBe(200);
      expect(res.body.relationships).toEqual([]);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/relationships`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent playthrough', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/relationships`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Playthrough not found');
    });

    it('returns 403 for another user playthrough', async () => {
      const { playthrough } = await createScenario('owner-rels@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'otherrels', email: 'other-rels@test.com' });

      const res = await otherAgent.get(`/api/playthroughs/${playthrough._id}/relationships`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/playthroughs/:playthroughId/consequences', () => {
    it('returns consequences for playthrough', async () => {
      const { agent, playthrough } = await createScenario();
      const chapter = await Chapter.create({ arcId: new mongoose.Types.ObjectId(), playthroughId: playthrough._id, chapterIndex: 1 });
      await ConsequenceSeed.create({ playthroughId: playthrough._id, triggerChapterId: chapter._id, triggerChapterIndex: 1, description: 'A dark secret revealed' });

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/consequences`);

      expect(res.status).toBe(200);
      expect(res.body.consequences).toHaveLength(1);
      expect(res.body.consequences[0].description).toBe('A dark secret revealed');
    });

    it('returns empty array when no consequences', async () => {
      const { agent, playthrough } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${playthrough._id}/consequences`);

      expect(res.status).toBe(200);
      expect(res.body.consequences).toEqual([]);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/consequences`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent playthrough', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/consequences`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Playthrough not found');
    });

    it('returns 403 for another user playthrough', async () => {
      const { playthrough } = await createScenario('owner-rels2@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'otherrels2', email: 'other-rels2@test.com' });

      const res = await otherAgent.get(`/api/playthroughs/${playthrough._id}/consequences`);

      expect(res.status).toBe(403);
    });
  });
});
