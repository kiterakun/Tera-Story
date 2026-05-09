import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Character } from '../../models/Character';
import { Item } from '../../models/Item';
import { SpecialItem } from '../../models/SpecialItem';

describe('Image routes — POST /api/images/regenerate', () => {
  beforeAll(async () => {
    await User.syncIndexes();
  });

  async function createScenario(email = 'images@test.com') {
    const agent = await registerAndGetAgent({ username: email.split('@')[0], email });
    const user = await User.findOne({ email }).orFail();
    const world = await World.create({ name: 'TestWorld', description: 'A test world', genre: 'fantasy', userId: user._id });
    const playthrough = await Playthrough.create({ name: 'PT', worldId: world._id, userId: user._id });
    const character = await Character.create({ name: 'Hero', role: 'protagonist', playthroughId: playthrough._id, worldId: world._id, userId: user._id });
    const item = await Item.create({ name: 'Sword', playthroughId: playthrough._id });
    const specialItem = await SpecialItem.create({ name: 'Excalibur', category: 'weapon', playthroughId: playthrough._id });
    return { agent, user, world, playthrough, character, item, specialItem };
  }

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/images/regenerate')
      .send({ entityType: 'character', entityId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(401);
  });

  it('returns 400 when entityType and entityId are missing', async () => {
    const { agent } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('entityType and entityId are required');
  });

  it('returns 400 when entityId is missing', async () => {
    const { agent } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'character' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('entityType and entityId are required');
  });

  it('returns 400 for invalid entityType', async () => {
    const { agent } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'nonexistent', entityId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid entityType');
  });

  it('regenerate queues image for owned character', async () => {
    const { agent, character } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'character', entityId: String(character._id) });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Image generation queued');
  });

  it('regenerate queues image for owned world', async () => {
    const { agent, world } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'world', entityId: String(world._id) });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Image generation queued');
  });

  it('regenerate queues image for item in owned playthrough', async () => {
    const { agent, item } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'item', entityId: String(item._id) });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Image generation queued');
  });

  it('regenerate queues image for special-item in owned playthrough', async () => {
    const { agent, specialItem } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'special-item', entityId: String(specialItem._id) });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Image generation queued');
  });

  it('returns 404 for non-existent character', async () => {
    const { agent } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'character', entityId: String(new mongoose.Types.ObjectId()) });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Character not found');
  });

  it('returns 404 for non-existent world', async () => {
    const { agent } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'world', entityId: String(new mongoose.Types.ObjectId()) });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('World not found');
  });

  it('returns 404 for non-existent item', async () => {
    const { agent } = await createScenario();

    const res = await agent
      .post('/api/images/regenerate')
      .send({ entityType: 'item', entityId: String(new mongoose.Types.ObjectId()) });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Item not found');
  });

  it('returns 403 for character owned by another user', async () => {
    const { character } = await createScenario('owner-images@test.com');
    const otherAgent = await registerAndGetAgent({ username: 'otherimages', email: 'other-images@test.com' });

    const res = await otherAgent
      .post('/api/images/regenerate')
      .send({ entityType: 'character', entityId: String(character._id) });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('returns 403 for world owned by another user', async () => {
    const { world } = await createScenario('owner-images2@test.com');
    const otherAgent = await registerAndGetAgent({ username: 'otherimages2', email: 'other-images2@test.com' });

    const res = await otherAgent
      .post('/api/images/regenerate')
      .send({ entityType: 'world', entityId: String(world._id) });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('returns 403 for item in another user playthrough', async () => {
    const { item } = await createScenario('owner-images3@test.com');
    const otherAgent = await registerAndGetAgent({ username: 'otherimages3', email: 'other-images3@test.com' });

    const res = await otherAgent
      .post('/api/images/regenerate')
      .send({ entityType: 'item', entityId: String(item._id) });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('returns 403 for special-item in another user playthrough', async () => {
    const { specialItem } = await createScenario('owner-images4@test.com');
    const otherAgent = await registerAndGetAgent({ username: 'otherimages4', email: 'other-images4@test.com' });

    const res = await otherAgent
      .post('/api/images/regenerate')
      .send({ entityType: 'special-item', entityId: String(specialItem._id) });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
