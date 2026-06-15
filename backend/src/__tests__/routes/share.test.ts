import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Chapter } from '../../models/Chapter';
import { ShareToken } from '../../models/ShareToken';

const v1PlaythroughsPath = '/api/v1/playthroughs';
const v1SharePath = '/api/v1/share/token';

describe('v1 share routes', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let playthroughId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await World.syncIndexes();
    await Playthrough.syncIndexes();
    await ShareToken.syncIndexes();
  });

  beforeEach(async () => {
    agent = await registerAndGetAgent({
      username: 'share-user',
      email: 'share-user@test.com',
      password: 'password123',
    });
    const user = await User.findOne({ email: 'share-user@test.com' }).orFail();
    userId = String(user._id);
    await User.findByIdAndUpdate(user._id, {
      displayName: 'Share User',
      'privacySettings.storyVisibility': 'public',
    });

    const world = await World.create({
      name: 'Shared World',
      description: 'A world for sharing',
      genre: 'fantasy',
      userId,
    });
    const playthrough = await Playthrough.create({
      name: 'Shared Tale',
      worldId: world._id,
      userId,
      status: 'active',
    });
    playthroughId = String(playthrough._id);
    await Chapter.create({
      playthroughId: playthrough._id,
      arcId: world._id,
      chapterIndex: 0,
      status: 'completed',
      toolsStatus: 'completed',
      content: 'Once upon a time.',
    });
  });

  it('creates a share token with the standard v1 envelope', async () => {
    const res = await agent.post(`${v1PlaythroughsPath}/${playthroughId}/share`).expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeTypeOf('string');
    expect(res.body.data.expiresAt).toBeTypeOf('string');
  });

  it('reads a shared snapshot with the standard v1 envelope', async () => {
    const created = await agent.post(`${v1PlaythroughsPath}/${playthroughId}/share`).expect(200);
    const token = created.body.data.token;

    const res = await request(app).get(`${v1SharePath}/${token}`).expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Shared Tale');
    expect(res.body.data.worldName).toBe('Shared World');
    expect(res.body.data.chapters).toHaveLength(1);
    expect(res.body.data.owner.displayName).toBe('Share User');
  });

  it('returns a standard v1 error envelope for missing tokens', async () => {
    const res = await request(app).get(`${v1SharePath}/missing-token-value-1234567890`).expect(404);

    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Share link not found or expired');
  });
});
