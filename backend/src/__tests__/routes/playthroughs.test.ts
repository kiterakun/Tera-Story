import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../../services/imageService', () => ({
  queueImageGeneration: vi.fn(),
}));

import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';

describe('Playthroughs routes', () => {
  let agent: request.SuperAgentTest;
  let worldId: string;

  beforeAll(async () => {
    await User.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({ username: 'pttester', email: 'pt@test.com' });
    const w = await agent.post('/api/worlds').send({ name: 'PlaythroughWorld', genre: 'fantasy' });
    worldId = w.body.world._id;
  });

  it('POST /api/worlds/:worldId/playthroughs creates playthrough', async () => {
    const res = await agent
      .post(`/api/worlds/${worldId}/playthroughs`)
      .send({ name: 'My Adventure' });

    expect(res.status).toBe(201);
    expect(res.body.playthrough).toMatchObject({ name: 'My Adventure' });
    expect(res.body.playthrough._id).toBeDefined();
  });

  it('POST /api/worlds/:worldId/playthroughs returns validation error for missing name', async () => {
    const res = await agent
      .post(`/api/worlds/${worldId}/playthroughs`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('POST /api/worlds/:worldId/playthroughs returns 404 for nonexistent world', async () => {
    const res = await agent
      .post('/api/worlds/aaaaaaaaaaaaaaaaaaaaaaaa/playthroughs')
      .send({ name: 'Ghost Adventure' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('World not found');
  });

  it('GET /api/worlds/:worldId/playthroughs lists playthroughs', async () => {
    await agent
      .post(`/api/worlds/${worldId}/playthroughs`)
      .send({ name: 'Adventure One' });

    const res = await agent.get(`/api/worlds/${worldId}/playthroughs`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.playthroughs)).toBe(true);
    expect(res.body.playthroughs.length).toBe(1);
  });

  it('GET /api/playthroughs/:id returns playthrough by ID', async () => {
    const create = await agent
      .post(`/api/worlds/${worldId}/playthroughs`)
      .send({ name: 'Adventure Two' });

    const res = await agent.get(`/api/playthroughs/${create.body.playthrough._id}`);

    expect(res.status).toBe(200);
    expect(res.body.playthrough.name).toBe('Adventure Two');
  });

  it('GET /api/playthroughs/:id returns 404 for nonexistent playthrough', async () => {
    const res = await agent.get('/api/playthroughs/aaaaaaaaaaaaaaaaaaaaaaaa');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Playthrough not found');
  });

  it('PUT /api/playthroughs/:id updates playthrough', async () => {
    const create = await agent
      .post(`/api/worlds/${worldId}/playthroughs`)
      .send({ name: 'Old Name' });

    const res = await agent
      .put(`/api/playthroughs/${create.body.playthrough._id}`)
      .send({ name: 'New Name', status: 'paused' });

    expect(res.status).toBe(200);
    expect(res.body.playthrough.name).toBe('New Name');
    expect(res.body.playthrough.status).toBe('paused');
  });

  it('DELETE /api/playthroughs/:id deletes playthrough', async () => {
    const create = await agent
      .post(`/api/worlds/${worldId}/playthroughs`)
      .send({ name: 'To Delete' });

    const res = await agent.delete(`/api/playthroughs/${create.body.playthrough._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Playthrough deleted successfully');
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get(`/api/worlds/${worldId}/playthroughs`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });
});
