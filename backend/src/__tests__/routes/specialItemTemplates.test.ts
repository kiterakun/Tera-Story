import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { SpecialItemTemplate } from '../../models/SpecialItemTemplate';

describe('Special Item Template routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  async function createScenario(email = 'sit@test.com') {
    const agent = await registerAndGetAgent({ username: email.split('@')[0], email });
    const user = await User.findOne({ email }).orFail();
    const world = await World.create({ name: 'TestWorld', description: 'desc', genre: 'fantasy', userId: user._id });
    return { agent, user, world };
  }

  describe('GET /api/worlds/:worldId/special-item-templates', () => {
    it('returns templates for world', async () => {
      const { agent, world } = await createScenario();
      await SpecialItemTemplate.create({ worldId: world._id, category: 'weapon', description: 'Weapons' });

      const res = await agent.get(`/api/worlds/${world._id}/special-item-templates`);

      expect(res.status).toBe(200);
      expect(res.body.specialItemTemplates).toHaveLength(1);
      expect(res.body.specialItemTemplates[0].category).toBe('weapon');
    });

    it('returns empty array when no templates', async () => {
      const { agent, world } = await createScenario();

      const res = await agent.get(`/api/worlds/${world._id}/special-item-templates`);

      expect(res.status).toBe(200);
      expect(res.body.specialItemTemplates).toEqual([]);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/worlds/${new mongoose.Types.ObjectId()}/special-item-templates`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent world', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/worlds/${new mongoose.Types.ObjectId()}/special-item-templates`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('World not found');
    });

    it('returns 403 for another user world', async () => {
      const { world } = await createScenario('owner-sit@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'othersit', email: 'other-sit@test.com' });

      const res = await otherAgent.get(`/api/worlds/${world._id}/special-item-templates`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied');
    });
  });

  describe('GET /api/special-item-templates/:id', () => {
    it('returns single template', async () => {
      const { agent, world } = await createScenario();
      const tmpl = await SpecialItemTemplate.create({ worldId: world._id, category: 'armor', description: 'Armor items' });

      const res = await agent.get(`/api/special-item-templates/${tmpl._id}`);

      expect(res.status).toBe(200);
      expect(res.body.specialItemTemplate.category).toBe('armor');
    });

    it('returns 404 for non-existent template', async () => {
      const { agent } = await createScenario();

      const res = await agent.get(`/api/special-item-templates/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Special item template not found');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/api/special-item-templates/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/worlds/:worldId/special-item-templates', () => {
    it('creates a template', async () => {
      const { agent, world } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates`)
        .send({ category: 'potion', description: 'Magical potions' });

      expect(res.status).toBe(201);
      expect(res.body.specialItemTemplate.category).toBe('potion');
      expect(res.body.specialItemTemplate.description).toBe('Magical potions');
    });

    it('creates a template with fields', async () => {
      const { agent, world } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates`)
        .send({
          category: 'spell',
          description: 'Spells',
          fields: [
            { name: 'element', type: 'enum', options: ['fire', 'water', 'earth'], required: true },
            { name: 'power', type: 'number' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.specialItemTemplate.fields).toHaveLength(2);
    });

    it('returns 400 when category is missing (Zod validation)', async () => {
      const { agent, world } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates`)
        .send({ description: 'no category' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when category is empty string', async () => {
      const { agent, world } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates`)
        .send({ category: '' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post(`/api/worlds/${new mongoose.Types.ObjectId()}/special-item-templates`)
        .send({ category: 'potion' });

      expect(res.status).toBe(401);
    });

    it('returns 403 for another user world', async () => {
      const { world } = await createScenario('owner-sit2@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'othersit2', email: 'other-sit2@test.com' });

      const res = await otherAgent
        .post(`/api/worlds/${world._id}/special-item-templates`)
        .send({ category: 'potion' });

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent world', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${new mongoose.Types.ObjectId()}/special-item-templates`)
        .send({ category: 'potion' });

      expect(res.status).toBe(404);
    });

    it('returns 409 for duplicate category in same world', async () => {
      const { agent, world } = await createScenario();

      await agent
        .post(`/api/worlds/${world._id}/special-item-templates`)
        .send({ category: 'unique-cat' });

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates`)
        .send({ category: 'unique-cat' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/worlds/:worldId/special-item-templates/batch', () => {
    it('creates multiple templates at once', async () => {
      const { agent, world } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates/batch`)
        .send({
          templates: [
            { category: 'weapon', description: 'Weapons' },
            { category: 'armor', description: 'Armor items' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.specialItemTemplates).toHaveLength(2);
    });

    it('returns 400 when templates array is empty', async () => {
      const { agent, world } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates/batch`)
        .send({ templates: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when templates is missing', async () => {
      const { agent, world } = await createScenario();

      const res = await agent
        .post(`/api/worlds/${world._id}/special-item-templates/batch`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post(`/api/worlds/${new mongoose.Types.ObjectId()}/special-item-templates/batch`)
        .send({ templates: [{ category: 'test' }] });

      expect(res.status).toBe(401);
    });

    it('returns 403 for another user world', async () => {
      const { world } = await createScenario('owner-sit3@test.com');
      const otherAgent = await registerAndGetAgent({ username: 'othersit3', email: 'other-sit3@test.com' });

      const res = await otherAgent
        .post(`/api/worlds/${world._id}/special-item-templates/batch`)
        .send({ templates: [{ category: 'test' }] });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/special-item-templates/:id', () => {
    it('updates a template', async () => {
      const { agent, world } = await createScenario();
      const tmpl = await SpecialItemTemplate.create({ worldId: world._id, category: 'original' });

      const res = await agent
        .put(`/api/special-item-templates/${tmpl._id}`)
        .send({ category: 'updated', description: 'Updated desc' });

      expect(res.status).toBe(200);
      expect(res.body.specialItemTemplate.category).toBe('updated');
      expect(res.body.specialItemTemplate.description).toBe('Updated desc');
    });

    it('returns 400 for empty category (Zod validation)', async () => {
      const { agent, world } = await createScenario();
      const tmpl = await SpecialItemTemplate.create({ worldId: world._id, category: 'original' });

      const res = await agent
        .put(`/api/special-item-templates/${tmpl._id}`)
        .send({ category: '' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent template', async () => {
      const { agent } = await createScenario();

      const res = await agent
        .put(`/api/special-item-templates/${new mongoose.Types.ObjectId()}`)
        .send({ category: 'updated' });

      expect(res.status).toBe(404);
    });

    it('returns 403 for template in another user world', async () => {
      const { world } = await createScenario('owner-sit4@test.com');
      const tmpl = await SpecialItemTemplate.create({ worldId: world._id, category: 'owned' });
      const otherAgent = await registerAndGetAgent({ username: 'othersit4', email: 'other-sit4@test.com' });

      const res = await otherAgent
        .put(`/api/special-item-templates/${tmpl._id}`)
        .send({ category: 'hijacked' });

      expect(res.status).toBe(403);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .put(`/api/special-item-templates/${new mongoose.Types.ObjectId()}`)
        .send({ category: 'test' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/special-item-templates/:id', () => {
    it('deletes a template', async () => {
      const { agent, world } = await createScenario();
      const tmpl = await SpecialItemTemplate.create({ worldId: world._id, category: 'todelete' });

      const res = await agent.delete(`/api/special-item-templates/${tmpl._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Special item template deleted successfully');

      const deleted = await SpecialItemTemplate.findById(tmpl._id);
      expect(deleted).toBeNull();
    });

    it('returns 404 for non-existent template', async () => {
      const { agent } = await createScenario();

      const res = await agent.delete(`/api/special-item-templates/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(404);
    });

    it('returns 403 for template in another user world', async () => {
      const { world } = await createScenario('owner-sit5@test.com');
      const tmpl = await SpecialItemTemplate.create({ worldId: world._id, category: 'owned-del' });
      const otherAgent = await registerAndGetAgent({ username: 'othersit5', email: 'other-sit5@test.com' });

      const res = await otherAgent.delete(`/api/special-item-templates/${tmpl._id}`);

      expect(res.status).toBe(403);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/api/special-item-templates/${new mongoose.Types.ObjectId()}`);

      expect(res.status).toBe(401);
    });
  });
});
