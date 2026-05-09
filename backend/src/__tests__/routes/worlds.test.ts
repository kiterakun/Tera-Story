import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../../services/imageService', () => ({
  queueImageGeneration: vi.fn(),
}));

import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';

describe('Worlds routes', () => {
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    await User.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({ username: 'worldtester', email: 'world@test.com' });
  });

  it('POST /api/worlds creates a world', async () => {
    const res = await agent
      .post('/api/worlds')
      .send({ name: 'Middle-earth', genre: 'fantasy', description: 'A fantasy realm' });

    expect(res.status).toBe(201);
    expect(res.body.world).toMatchObject({ name: 'Middle-earth', genre: 'fantasy' });
    expect(res.body.world._id).toBeDefined();
  });

  it('POST /api/worlds returns validation error for missing name', async () => {
    const res = await agent
      .post('/api/worlds')
      .send({ genre: 'fantasy' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('POST /api/worlds returns validation error for invalid genre', async () => {
    const res = await agent
      .post('/api/worlds')
      .send({ name: 'Test World', genre: 'invalid-genre' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('GET /api/worlds lists user worlds', async () => {
    await agent.post('/api/worlds').send({ name: 'Arda', genre: 'fantasy' });

    const res = await agent.get('/api/worlds');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.worlds)).toBe(true);
    expect(res.body.worlds.length).toBe(1);
    expect(res.body.worlds[0].name).toBe('Arda');
  });

  it('GET /api/worlds/:id returns world by ID', async () => {
    const create = await agent
      .post('/api/worlds')
      .send({ name: 'Narnia', genre: 'fantasy' });

    const res = await agent.get(`/api/worlds/${create.body.world._id}`);

    expect(res.status).toBe(200);
    expect(res.body.world.name).toBe('Narnia');
  });

  it('GET /api/worlds/:id returns 404 for nonexistent world', async () => {
    const res = await agent.get('/api/worlds/aaaaaaaaaaaaaaaaaaaaaaaa');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('World not found');
  });

  it('PUT /api/worlds/:id updates world', async () => {
    const create = await agent
      .post('/api/worlds')
      .send({ name: 'Azeroth', genre: 'fantasy' });

    const res = await agent
      .put(`/api/worlds/${create.body.world._id}`)
      .send({ name: 'Updated Azeroth' });

    expect(res.status).toBe(200);
    expect(res.body.world.name).toBe('Updated Azeroth');
  });

  it('PUT /api/worlds/:id returns 404 for nonexistent world', async () => {
    const res = await agent
      .put('/api/worlds/aaaaaaaaaaaaaaaaaaaaaaaa')
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('World not found');
  });

  it('DELETE /api/worlds/:id deletes world', async () => {
    const create = await agent
      .post('/api/worlds')
      .send({ name: 'Cybertron', genre: 'sci-fi' });

    const res = await agent.delete(`/api/worlds/${create.body.world._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('World deleted successfully');
  });

  it('DELETE /api/worlds/:id returns 404 for nonexistent world', async () => {
    const res = await agent.delete('/api/worlds/aaaaaaaaaaaaaaaaaaaaaaaa');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('World not found');
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/worlds');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });
});
