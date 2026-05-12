import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { Playthrough } from '../../models/Playthrough';
import { Arc } from '../../models/Arc';
import { Chapter } from '../../models/Chapter';
import { User } from '../../models/User';

const chroniclePath = (playthroughId: string) =>
  `/api/playthroughs/${playthroughId}/chronicle`;

describe('Chronicle routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let otherUserId: string;
  let playthroughId: string;
  let otherPlaythroughId: string;
  let emptyPlaythroughId: string;
  let firstArcId: string;
  let secondArcId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await Arc.syncIndexes();
    await Chapter.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({
      username: 'chronicle-user',
      email: 'chronicle-user@test.com',
      password: 'password123',
    });

    const user = await User.findOne({ email: 'chronicle-user@test.com' }).orFail();
    const otherUser = await User.create({
      username: 'other-chronicle-user',
      email: 'other-chronicle-user@test.com',
      password: 'password123',
    });

    userId = String(user._id);
    otherUserId = String(otherUser._id);

    const playthrough = await Playthrough.create({
      name: 'Chronicle Test Run',
      worldId: new mongoose.Types.ObjectId(),
      userId: user._id,
      status: 'completed',
      completedAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const emptyPlaythrough = await Playthrough.create({
      name: 'Empty Chronicle Test Run',
      worldId: new mongoose.Types.ObjectId(),
      userId: user._id,
    });

    const otherPlaythrough = await Playthrough.create({
      name: 'Other Chronicle Test Run',
      worldId: new mongoose.Types.ObjectId(),
      userId: otherUser._id,
    });

    playthroughId = String(playthrough._id);
    emptyPlaythroughId = String(emptyPlaythrough._id);
    otherPlaythroughId = String(otherPlaythrough._id);

    const firstArc = await Arc.create({
      title: 'The Broken Gate',
      summary: 'Heroes enter through the broken gate.',
      playthroughId: playthrough._id,
      arcIndex: 0,
      status: 'completed',
    });
    const secondArc = await Arc.create({
      title: 'Ashen Crown',
      playthroughId: playthrough._id,
      arcIndex: 1,
      status: 'active',
    });

    firstArcId = String(firstArc._id);
    secondArcId = String(secondArc._id);

    await Chapter.create([
      {
        content: 'The party chooses the old road.',
        arcId: firstArc._id,
        playthroughId: playthrough._id,
        chapterIndex: 0,
        status: 'completed',
        playerChoice: 'Take the old road',
        choices: [
          { text: 'Enter the gate', type: 'continue' },
          { text: 'Circle around', type: 'custom' },
        ],
      },
      {
        content: 'A guardian asks for tribute.',
        arcId: firstArc._id,
        playthroughId: playthrough._id,
        chapterIndex: 1,
        status: 'completed',
        playerChoice: 'Offer tribute',
        choices: [{ text: 'Offer silver', type: 'continue' }],
      },
      {
        content: 'The crown glows beneath ash.',
        arcId: secondArc._id,
        playthroughId: playthrough._id,
        chapterIndex: 2,
        status: 'completed',
        playerChoice: 'Lift the crown',
        choices: [
          { text: 'Lift it', type: 'continue' },
          { text: 'Leave it', type: 'new_arc' },
        ],
      },
    ]);
  });

  describe('GET /api/playthroughs/:playthroughId/chronicle', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get(chroniclePath(playthroughId));

      expect(res.status).toBe(401);
    });

    it('returns 404 for nonexistent playthrough', async () => {
      const res = await agent.get(chroniclePath('aaaaaaaaaaaaaaaaaaaaaaaa'));

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Playthrough not found');
    });

    it('returns 403 for different user playthrough', async () => {
      const res = await agent.get(chroniclePath(otherPlaythroughId));

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Access denied');
    });

    it('returns chronicle with arcs and stats', async () => {
      const res = await agent.get(chroniclePath(playthroughId));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.playthroughName).toBe('Chronicle Test Run');
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.chronicle.arcSummaries).toHaveLength(2);
      expect(res.body.data.chronicle.arcSummaries[0]).toMatchObject({
        arcId: firstArcId,
        title: 'The Broken Gate',
        summary: 'Heroes enter through the broken gate.',
      });
      expect(res.body.data.chronicle.arcSummaries[0].keyScenes).toEqual([]);
      expect(res.body.data.chronicle.arcSummaries[1]).toMatchObject({
        arcId: secondArcId,
        title: 'Ashen Crown',
        summary: 'Arc 2: Ashen Crown',
      });
      expect(res.body.data.chronicle.stats).toMatchObject({
        totalScenes: 3,
        totalChoices: 5,
        totalCombats: 0,
      });
      expect(res.body.data.chronicle.generatedAt).toBeTruthy();
    });

    it('returns empty arcs for playthrough without arcs', async () => {
      const res = await agent.get(chroniclePath(emptyPlaythroughId));

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.playthroughName).toBe('Empty Chronicle Test Run');
      expect(res.body.data.chronicle).toBeNull();
    });

    it('forceRegenerate=true refreshes stale chronicle cache', async () => {
      const staleDate = new Date('2024-01-01T00:00:00.000Z');
      await Playthrough.findByIdAndUpdate(playthroughId, {
        $set: {
          chronicleCache: {
            generatedAt: staleDate,
            arcSummaries: [
              {
                arcId: firstArcId,
                title: 'Stale Title',
                summary: 'Stale summary',
                sceneCount: 99,
                keyScenes: [],
              },
              {
                arcId: secondArcId,
                title: 'Stale Second Title',
                summary: 'Stale second summary',
                sceneCount: 99,
                keyScenes: [],
              },
            ],
            stats: {
              totalScenes: 99,
              totalChoices: 99,
              totalCombats: 99,
              totalPlayTimeMinutes: 99,
            },
          },
        },
      });

      const res = await agent.get(`${chroniclePath(playthroughId)}?forceRegenerate=true`);

      expect(res.status).toBe(200);
      expect(res.body.data.chronicle.arcSummaries[0].title).toBe('The Broken Gate');
      expect(res.body.data.chronicle.arcSummaries[0].sceneCount).toBe(0);
      expect(res.body.data.chronicle.stats.totalScenes).toBe(3);
      expect(res.body.data.chronicle.stats.totalChoices).toBe(5);
      expect(new Date(res.body.data.chronicle.generatedAt).getTime()).toBeGreaterThan(
        staleDate.getTime()
      );
    });
  });

  describe('POST /api/playthroughs/:playthroughId/chronicle/regenerate', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post(`${chroniclePath(playthroughId)}/regenerate`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for nonexistent playthrough', async () => {
      const res = await agent.post(`${chroniclePath('aaaaaaaaaaaaaaaaaaaaaaaa')}/regenerate`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Playthrough not found');
    });

    it('returns 403 for different user playthrough', async () => {
      const res = await agent.post(`${chroniclePath(otherPlaythroughId)}/regenerate`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Access denied');
    });

    it('regenerates cache and returns chronicle', async () => {
      await Playthrough.findByIdAndUpdate(playthroughId, {
        $set: {
          chronicleCache: {
            generatedAt: new Date('2024-01-01T00:00:00.000Z'),
            arcSummaries: [],
            stats: {
              totalScenes: 0,
              totalChoices: 0,
              totalCombats: 0,
              totalPlayTimeMinutes: 0,
            },
          },
        },
      });

      const res = await agent.post(`${chroniclePath(playthroughId)}/regenerate`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.chronicle.chronicle.arcSummaries).toHaveLength(2);
      expect(res.body.data.chronicle.chronicle.stats.totalScenes).toBe(3);
      expect(res.body.data.chronicle.chronicle.stats.totalChoices).toBe(5);

      const updated = await Playthrough.findById(playthroughId).lean().orFail();
      expect(updated.chronicleCache?.arcSummaries).toHaveLength(2);
      expect(updated.chronicleCache?.stats.totalScenes).toBe(3);
    });
  });

  describe('POST /api/playthroughs/:playthroughId/chronicle/share', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post(`${chroniclePath(playthroughId)}/share`);

      expect(res.status).toBe(401);
    });

    it('returns 404 for nonexistent playthrough', async () => {
      const res = await agent.post(`${chroniclePath('aaaaaaaaaaaaaaaaaaaaaaaa')}/share`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Playthrough not found');
    });

    it('returns 403 for different user playthrough', async () => {
      const res = await agent.post(`${chroniclePath(otherPlaythroughId)}/share`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Access denied');
    });

    it('generates shareId and returns share URL', async () => {
      const res = await agent.post(`${chroniclePath(playthroughId)}/share`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.shareUrl).toMatch(/^\/share\/chronicle\/[0-9a-f-]{36}$/);

      const updated = await Playthrough.findById(playthroughId).lean().orFail();
      expect(updated.shareId).toBeTruthy();
      expect(res.body.data.shareUrl).toBe(`/share/chronicle/${updated.shareId}`);
    });

    it('returns existing shareId if already generated', async () => {
      const existingShareId = 'existing-chronicle-share-id';
      await Playthrough.findByIdAndUpdate(playthroughId, {
        $set: { shareId: existingShareId },
      });

      const res = await agent.post(`${chroniclePath(playthroughId)}/share`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.shareUrl).toBe(`/share/chronicle/${existingShareId}`);

      const updated = await Playthrough.findById(playthroughId).lean().orFail();
      expect(updated.shareId).toBe(existingShareId);
    });
  });

  it('keeps ownership fixtures distinct', () => {
    expect(userId).not.toBe(otherUserId);
  });
});
