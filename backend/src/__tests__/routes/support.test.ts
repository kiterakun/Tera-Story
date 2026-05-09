import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Chapter } from '../../models/Chapter';

describe('Support routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
    await Chapter.syncIndexes();
  });

  async function createScenario(email = 'support@test.com') {
    const agent = await registerAndGetAgent({ username: email.split('@')[0], email });
    const user = await User.findOne({ email }).orFail();
    // UserSettings auto-created on register, so no need to manually create
    return { agent, user };
  }

  describe('POST /api/support/enrich-world', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/support/enrich-world')
        .send({ description: 'A magical forest' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when description is missing', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-world')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('description is required');
    });

    // enrich-world calls actual AI — test auth+validation only
  });

  describe('POST /api/support/enrich-character', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/support/enrich-character')
        .send({ description: 'A brave knight' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when description is missing', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-character')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('description is required');
    });
  });

  describe('POST /api/support/enrich-choices', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/support/enrich-choices')
        .send({ playthroughId: String(new mongoose.Types.ObjectId()) });

      expect(res.status).toBe(401);
    });

    it('returns 400 when playthroughId is missing', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-choices')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('playthroughId is required');
    });

    it('returns 404 for non-existent playthrough', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-choices')
        .send({ playthroughId: String(new mongoose.Types.ObjectId()) });

      // Playthrough not found returns 404 (validates playthrough exists and belongs to user)
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/support/enrich-custom-choice', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/support/enrich-custom-choice')
        .send({ playthroughId: String(new mongoose.Types.ObjectId()), customChoice: 'Go left' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when playthroughId and customChoice are missing', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-custom-choice')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('playthroughId and customChoice are required');
    });

    it('returns 400 when only customChoice is provided', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-custom-choice')
        .send({ customChoice: 'Go left' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('playthroughId and customChoice are required');
    });

    it('returns 400 when only playthroughId is provided', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-custom-choice')
        .send({ playthroughId: String(new mongoose.Types.ObjectId()) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('playthroughId and customChoice are required');
    });

    it('returns 404 for non-existent playthrough', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post('/api/support/enrich-custom-choice')
        .send({ playthroughId: String(new mongoose.Types.ObjectId()), customChoice: 'Go left' });

      // Playthrough not found or not owned by user returns 404
      expect(res.status).toBe(404);
    });

    // enrich-custom-choice requires existing chapters in the playthrough
    // to build story context. Without chapters it returns 400 'No chapters found'
    it('returns 400 when playthrough exists but has no chapters', async () => {
      const agent = await registerAndGetAgent({ username: 'supchoice', email: 'support-choice@test.com' });
      const user = await User.findOne({ email: 'support-choice@test.com' }).orFail();
      const world = await World.create({ name: 'w', description: 'd', genre: 'fantasy', userId: user._id });
      const playthrough = await Playthrough.create({ name: 'p', worldId: world._id, userId: user._id });

      const res = await agent
        .post('/api/support/enrich-custom-choice')
        .send({ playthroughId: String(playthrough._id), customChoice: 'Go left' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No chapters found');
    });
  });
});
