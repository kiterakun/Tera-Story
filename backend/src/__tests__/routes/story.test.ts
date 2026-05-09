import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../../services/imageService', () => ({
  queueImageGeneration: vi.fn(),
}));

vi.mock('../../services/storyOrchestrator', () => ({
  generateChapter: vi.fn(async (playthroughId: string, choice: string) => ({
    chapter: { _id: 'mock-chapter-id', playthroughId, playerChoice: choice, status: 'completed' },
    content: 'Generated story content',
  })),
  generateChapterStream: vi.fn(),
  retryChapter: vi.fn(),
  retryChapterTools: vi.fn(),
  summarizeCurrentArc: vi.fn(),
}));

import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';

describe('Story routes', () => {
  let agent: request.SuperAgentTest;
  let playthroughId: string;

  beforeAll(async () => {
    await User.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({ username: 'storytester', email: 'story@test.com' });
    const w = await agent.post('/api/worlds').send({ name: 'StoryWorld', genre: 'fantasy' });
    const pt = await agent
      .post(`/api/worlds/${w.body.world._id}/playthroughs`)
      .send({ name: 'StoryPlaythrough' });
    playthroughId = pt.body.playthrough._id;
  });

  it('POST /api/story/generate returns generated chapter', async () => {
    const res = await agent
      .post('/api/story/generate')
      .send({ playthroughId, choice: 'Enter the ruins' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.content).toBe('Generated story content');
    expect(res.body.chapter).toMatchObject({ playthroughId, playerChoice: 'Enter the ruins' });
  });

  it('POST /api/story/generate returns 400 for missing fields', async () => {
    const res = await agent.post('/api/story/generate').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('playthroughId and choice are required');
  });

  it('POST /api/story/generate returns 400 for missing choice', async () => {
    const res = await agent.post('/api/story/generate').send({ playthroughId });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('playthroughId and choice are required');
  });

  it('POST /api/story/generate rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/story/generate')
      .send({ playthroughId, choice: 'Continue the story' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  it('GET /api/story/:playthroughId/state returns story state', async () => {
    const res = await agent.get(`/api/story/${playthroughId}/state`);

    expect(res.status).toBe(200);
    expect(res.body.playthrough).toBeDefined();
    expect(res.body.playthrough.name).toBe('StoryPlaythrough');
    expect(res.body.isNewGame).toBe(true);
    expect(res.body.chapters).toEqual([]);
    expect(res.body.isGenerating).toBe(false);
  });

  it('GET /api/story/:playthroughId/state returns 404 for nonexistent playthrough', async () => {
    const res = await agent.get('/api/story/aaaaaaaaaaaaaaaaaaaaaaaa/state');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Playthrough not found');
  });

  it('GET /api/story/:playthroughId/state rejects unauthenticated requests', async () => {
    const res = await request(app).get(`/api/story/${playthroughId}/state`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  it('POST /api/story/summarize-arc returns 400 for missing playthroughId', async () => {
    const res = await agent.post('/api/story/summarize-arc').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('playthroughId is required');
  });
});
