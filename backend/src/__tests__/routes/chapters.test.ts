import request from 'supertest';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { Arc } from '../../models/Arc';
import { Chapter } from '../../models/Chapter';
import { User } from '../../models/User';

describe('Chapters routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let playthroughId: string;
  let arcId: string;
  let chapterId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await Arc.syncIndexes();
    await Chapter.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({ username: 'chaptertester', email: 'chapter@test.com' });
    const w = await agent.post('/api/worlds').send({ name: 'ChapterWorld', genre: 'fantasy' });
    const pt = await agent
      .post(`/api/worlds/${w.body.world._id}/playthroughs`)
      .send({ name: 'ChapterPlaythrough' });
    playthroughId = pt.body.playthrough._id;

    // Create arc + chapter directly via models for read-only route testing
    const arc = await Arc.create({
      title: 'Arc One',
      playthroughId: pt.body.playthrough._id,
      arcIndex: 1,
      status: 'active',
    });
    arcId = arc._id.toString();

    const chapter = await Chapter.create({
      content: 'Once upon a time...',
      arcId: arc._id,
      playthroughId: pt.body.playthrough._id,
      chapterIndex: 1,
      status: 'completed',
    });
    chapterId = chapter._id.toString();
  });

  it('GET /api/playthroughs/:playthroughId/arcs lists arcs with chapter counts', async () => {
    const res = await agent.get(`/api/playthroughs/${playthroughId}/arcs`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.arcs)).toBe(true);
    expect(res.body.arcs.length).toBe(1);
    expect(res.body.arcs[0].title).toBe('Arc One');
    expect(res.body.arcs[0].chapterCount).toBe(1);
  });

  it('GET /api/playthroughs/:playthroughId/arcs returns 404 for nonexistent playthrough', async () => {
    const res = await agent.get('/api/playthroughs/aaaaaaaaaaaaaaaaaaaaaaaa/arcs');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Playthrough not found');
  });

  it('GET /api/arcs/:arcId/chapters lists chapters in arc', async () => {
    const res = await agent.get(`/api/arcs/${arcId}/chapters`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.chapters)).toBe(true);
    expect(res.body.chapters.length).toBe(1);
    expect(res.body.chapters[0].status).toBe('completed');
  });

  it('GET /api/arcs/:arcId/chapters returns 404 for nonexistent arc', async () => {
    const res = await agent.get('/api/arcs/aaaaaaaaaaaaaaaaaaaaaaaa/chapters');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Arc not found');
  });

  it('GET /api/chapters/:id returns chapter by ID', async () => {
    const res = await agent.get(`/api/chapters/${chapterId}`);

    expect(res.status).toBe(200);
    expect(res.body.chapter.content).toBe('Once upon a time...');
  });

  it('GET /api/chapters/:id returns 404 for nonexistent chapter', async () => {
    const res = await agent.get('/api/chapters/aaaaaaaaaaaaaaaaaaaaaaaa');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Chapter not found');
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get(`/api/playthroughs/${playthroughId}/arcs`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });
});
