import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent, loginAndGetAgent } from '../helpers';
import { Echo } from '../../models/Echo';
import { Playthrough } from '../../models/Playthrough';
import { User } from '../../models/User';

const basePath = (playthroughId: string) => `/api/playthroughs/${playthroughId}/echoes`;

describe('Echoes Routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let playthroughId: string;
  let otherUserId: string;
  let otherPlaythroughId: string;
  let plantedEchoId: string;
  let approachingEchoId: string;
  let activeEchoId: string;
  let resolvedEchoId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await Echo.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({
      username: 'echo-user',
      email: 'echo-user@test.com',
      password: 'password123',
    });
    agent = await loginAndGetAgent('echo-user@test.com', 'password123');

    const user = await User.findOne({ email: 'echo-user@test.com' }).orFail();
    const otherUser = await User.create({
      username: 'other-echo-user',
      email: 'other-echo-user@test.com',
      password: 'password123',
    });

    userId = String(user._id);
    otherUserId = String(otherUser._id);

    const playthrough = await Playthrough.create({
      name: 'Echo Test Run',
      worldId: new mongoose.Types.ObjectId(),
      userId: user._id,
      currentArcIndex: 5,
      echoesCount: 4,
      echoesResolvedCount: 1,
    });
    const otherPlaythrough = await Playthrough.create({
      name: 'Other Echo Test Run',
      worldId: new mongoose.Types.ObjectId(),
      userId: otherUser._id,
    });

    playthroughId = String(playthrough._id);
    otherPlaythroughId = String(otherPlaythrough._id);

    const triggerChapterIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];

    const echoes = await Echo.create([
      {
        playthroughId: playthrough._id,
        triggerChapterId: triggerChapterIds[0],
        triggerChapterIndex: 1,
        targetChapterIndex: 6,
        type: 'mercy',
        description: 'Mercy shown to a stranger returns soon.',
        status: 'planted',
        minChapterDelay: 5,
        maxChapterDelay: 10,
      },
      {
        playthroughId: playthrough._id,
        triggerChapterId: triggerChapterIds[1],
        triggerChapterIndex: 2,
        targetChapterIndex: 8,
        type: 'betrayal',
        description: 'Betrayal consequence approaches.',
        status: 'approaching',
        minChapterDelay: 5,
        maxChapterDelay: 10,
      },
      {
        playthroughId: playthrough._id,
        triggerChapterId: triggerChapterIds[2],
        triggerChapterIndex: 3,
        targetChapterIndex: 12,
        type: 'discovery',
        description: 'Far discovery becomes active later.',
        status: 'active',
        minChapterDelay: 5,
        maxChapterDelay: 10,
      },
      {
        playthroughId: playthrough._id,
        triggerChapterId: triggerChapterIds[3],
        triggerChapterIndex: 4,
        targetChapterIndex: 7,
        type: 'consequence',
        description: 'Resolved echo should stay resolved.',
        narrative: 'This echo already resolved.',
        status: 'resolved',
        minChapterDelay: 5,
        maxChapterDelay: 10,
        resolvedAt: new Date(),
      },
    ]);

    plantedEchoId = String(echoes[0]!._id);
    approachingEchoId = String(echoes[1]!._id);
    activeEchoId = String(echoes[2]!._id);
    resolvedEchoId = String(echoes[3]!._id);
  });

  describe('GET /api/playthroughs/:playthroughId/echoes', () => {
    it('returns echoes list with pagination', async () => {
      const res = await agent.get(`${basePath(playthroughId)}?limit=2&offset=1`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.total).toBe(4);
      expect(res.body.data.limit).toBe(2);
      expect(res.body.data.offset).toBe(1);
      expect(res.body.data.echoes).toHaveLength(2);
    });

    it('returns empty echoes list when playthrough has no echoes', async () => {
      const emptyPlaythrough = await Playthrough.create({
        name: 'Empty Echo Run',
        worldId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
      });

      const res = await agent.get(basePath(String(emptyPlaythrough._id)));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.echoes).toEqual([]);
    });

    it('filters echoes by status query param', async () => {
      const res = await agent.get(`${basePath(playthroughId)}?status=resolved`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.echoes).toHaveLength(1);
      expect(res.body.data.echoes[0]._id).toBe(resolvedEchoId);
      expect(res.body.data.echoes[0].status).toBe('resolved');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get(basePath(playthroughId));

      expect(res.status).toBe(401);
    });

    it('returns 404 for nonexistent playthrough', async () => {
      const missingPlaythroughId = new mongoose.Types.ObjectId();

      const res = await agent.get(basePath(String(missingPlaythroughId)));

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Playthrough not found');
    });

    it('returns 403 for different user playthrough', async () => {
      expect(otherUserId).toBeDefined();

      const res = await agent.get(basePath(otherPlaythroughId));

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Access denied');
    });
  });

  describe('GET /api/playthroughs/:playthroughId/echoes/pending', () => {
    it('returns only planted, approaching, and active echoes', async () => {
      const res = await agent.get(`${basePath(playthroughId)}/pending`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.echoes).toHaveLength(3);
      expect(res.body.data.echoes.map((echo: { status: string }) => echo.status)).toEqual([
        'planted',
        'approaching',
        'active',
      ]);
      expect(res.body.data.echoes.some((echo: { _id: string }) => echo._id === resolvedEchoId)).toBe(false);
    });

    it('returns empty list when all echoes are resolved', async () => {
      await Echo.updateMany({ playthroughId }, { $set: { status: 'resolved', resolvedAt: new Date() } });

      const res = await agent.get(`${basePath(playthroughId)}/pending`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.echoes).toEqual([]);
    });
  });

  describe('GET /api/playthroughs/:playthroughId/echoes/upcoming', () => {
    it('returns unresolved echoes with targetChapterIndex within next 3 chapters', async () => {
      const res = await agent.get(`${basePath(playthroughId)}/upcoming?ahead=3`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.currentChapterIndex).toBe(5);
      expect(res.body.data.echoes).toHaveLength(2);
      expect(res.body.data.echoes.map((echo: { _id: string }) => echo._id)).toEqual([
        plantedEchoId,
        approachingEchoId,
      ]);
      expect(res.body.data.echoes.every((echo: { targetChapterIndex: number }) => echo.targetChapterIndex <= 8)).toBe(true);
    });
  });

  describe('GET /api/playthroughs/:playthroughId/echoes/:echoId', () => {
    it('returns a single echo', async () => {
      const res = await agent.get(`${basePath(playthroughId)}/${plantedEchoId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.echo._id).toBe(plantedEchoId);
      expect(res.body.data.echo.description).toBe('Mercy shown to a stranger returns soon.');
    });

    it('returns 404 when echo is not found', async () => {
      const missingEchoId = new mongoose.Types.ObjectId();

      const res = await agent.get(`${basePath(playthroughId)}/${String(missingEchoId)}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Echo not found');
    });

    it('returns 404 when echo belongs to another playthrough', async () => {
      const otherEcho = await Echo.create({
        playthroughId: new mongoose.Types.ObjectId(otherPlaythroughId),
        triggerChapterId: new mongoose.Types.ObjectId(),
        triggerChapterIndex: 1,
        targetChapterIndex: 6,
        type: 'mercy',
        description: 'Other playthrough echo.',
        status: 'planted',
        minChapterDelay: 5,
        maxChapterDelay: 10,
      });

      const res = await agent.get(`${basePath(playthroughId)}/${String(otherEcho._id)}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Echo not found');
    });
  });

  describe('PATCH /api/playthroughs/:playthroughId/echoes/:echoId/status', () => {
    it.each(['approaching', 'active', 'resolved'] as const)('updates status to %s', async (status) => {
      const res = await agent
        .patch(`${basePath(playthroughId)}/${plantedEchoId}/status`)
        .send({ status });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.echo._id).toBe(plantedEchoId);
      expect(res.body.data.echo.status).toBe(status);

      const echo = await Echo.findById(plantedEchoId).orFail();
      expect(echo.status).toBe(status);
    });

    it('returns 400 for invalid status', async () => {
      const res = await agent
        .patch(`${basePath(playthroughId)}/${plantedEchoId}/status`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/playthroughs/:playthroughId/echoes/:echoId/resolve', () => {
    it('resolves echo with narrative', async () => {
      const res = await agent
        .post(`${basePath(playthroughId)}/${activeEchoId}/resolve`)
        .send({ narrative: 'The discovery blooms into consequence.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.echo._id).toBe(activeEchoId);
      expect(res.body.data.echo.status).toBe('resolved');
      expect(res.body.data.echo.narrative).toBe('The discovery blooms into consequence.');
      expect(res.body.data.echo.resolvedAt).toBeTruthy();

      const playthrough = await Playthrough.findById(playthroughId).orFail();
      expect(playthrough.echoesResolvedCount).toBe(2);
    });

    it('returns 400 for empty narrative', async () => {
      const res = await agent
        .post(`${basePath(playthroughId)}/${approachingEchoId}/resolve`)
        .send({ narrative: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });
});
