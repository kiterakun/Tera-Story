import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../../services/imageService', () => ({
  queueImageGeneration: vi.fn(),
}));

import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';

describe('Characters routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let playthroughId: string;

  beforeAll(async () => {
    await User.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({ username: 'chartester', email: 'char@test.com' });
    const w = await agent.post('/api/worlds').send({ name: 'CharWorld', genre: 'fantasy' });
    const pt = await agent
      .post(`/api/worlds/${w.body.world._id}/playthroughs`)
      .send({ name: 'CharPlaythrough' });
    playthroughId = pt.body.playthrough._id;
  });

  it('POST /api/playthroughs/:playthroughId/characters creates character', async () => {
    const res = await agent
      .post(`/api/playthroughs/${playthroughId}/characters`)
      .send({ name: 'Aragorn', role: 'protagonist', description: 'A ranger from the North' });

    expect(res.status).toBe(201);
    expect(res.body.character).toMatchObject({ name: 'Aragorn', role: 'protagonist' });
    expect(res.body.character._id).toBeDefined();
  });

  it('POST /api/playthroughs/:playthroughId/characters returns 400 for missing name', async () => {
    const res = await agent
      .post(`/api/playthroughs/${playthroughId}/characters`)
      .send({ role: 'npc' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Name is required');
  });

  it('POST /api/playthroughs/:playthroughId/characters returns 400 for invalid role', async () => {
    const res = await agent
      .post(`/api/playthroughs/${playthroughId}/characters`)
      .send({ name: 'Gandalf', role: 'invalid-role' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Role must be');
  });

  it('POST /api/playthroughs/:playthroughId/characters returns 404 for nonexistent playthrough', async () => {
    const res = await agent
      .post('/api/playthroughs/aaaaaaaaaaaaaaaaaaaaaaaa/characters')
      .send({ name: 'Ghost', role: 'npc' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Playthrough not found');
  });

  it('GET /api/playthroughs/:playthroughId/characters lists characters', async () => {
    await agent
      .post(`/api/playthroughs/${playthroughId}/characters`)
      .send({ name: 'Frodo', role: 'protagonist' });

    const res = await agent.get(`/api/playthroughs/${playthroughId}/characters`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.characters)).toBe(true);
    expect(res.body.characters.length).toBe(1);
  });

  it('GET /api/characters/:id returns character by ID', async () => {
    const create = await agent
      .post(`/api/playthroughs/${playthroughId}/characters`)
      .send({ name: 'Legolas', role: 'npc' });

    const res = await agent.get(`/api/characters/${create.body.character._id}`);

    expect(res.status).toBe(200);
    expect(res.body.character.name).toBe('Legolas');
  });

  it('GET /api/characters/:id returns 404 for nonexistent character', async () => {
    const res = await agent.get('/api/characters/aaaaaaaaaaaaaaaaaaaaaaaa');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Character not found');
  });

  it('PUT /api/characters/:id updates character', async () => {
    const create = await agent
      .post(`/api/playthroughs/${playthroughId}/characters`)
      .send({ name: 'Gimli', role: 'protagonist' });

    const res = await agent
      .put(`/api/characters/${create.body.character._id}`)
      .send({ name: 'Gimli son of Gloin', description: 'Updated description' });

    expect(res.status).toBe(200);
    expect(res.body.character.name).toBe('Gimli son of Gloin');
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get(`/api/playthroughs/${playthroughId}/characters`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });
});
