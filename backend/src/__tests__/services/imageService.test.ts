import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { queueImageGeneration } from '../../services/imageService';
import { UserSettings } from '../../models/UserSettings';
import { World } from '../../models/World';
import { User } from '../../models/User';
import { ImageTask } from '../../models/ImageTask';
import { generateImage } from '../../agents/imageAgent';
import { createUserProviderRegistry } from '../../providers/registry';

vi.mock('../../agents/imageAgent', () => ({
  generateImage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../providers/registry', () => ({
  createUserProviderRegistry: vi.fn().mockReturnValue({
    getImageConfig: vi.fn().mockReturnValue({
      provider: 'openai',
      model: 'dall-e-3',
    }),
  }),
}));

function defaultAISettings() {
  return {
    contextAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    writerAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    supportAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    imageAgent: { provider: 'openai' as const, model: 'dall-e-3' },
  };
}

describe('imageService – queueImageGeneration', () => {
  let userId: string;
  let worldId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await UserSettings.syncIndexes();
    await ImageTask.syncIndexes();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const user = await User.create({
      username: 'imguser',
      email: 'imguser@test.com',
      password: 'password123',
    });
    userId = String(user._id);

    const world = await World.create({
      name: 'TestWorld',
      genre: 'fantasy',
      userId: user._id,
    });
    worldId = String(world._id);

    await UserSettings.create({
      userId: user._id,
      aiSettings: defaultAISettings(),
    });
  });

  it('persists job and calls generateImage for queued item', async () => {
    queueImageGeneration(
      { name: 'Aria', description: 'A brave knight' },
      'character',
      'char-1',
      worldId,
      userId,
    );

    await vi.waitFor(
      async () => {
        const task = await ImageTask.findOne({ entityId: 'char-1' }).lean();
        expect(task?.status).toBe('completed');
      },
      { timeout: 5000 },
    );

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Aria' }),
      'character',
      'char-1',
      expect.objectContaining({ name: 'TestWorld' }),
      expect.objectContaining({ model: 'dall-e-3' }),
    );
  });

  it('processes multiple jobs', async () => {
    queueImageGeneration(
      { name: 'Sword', description: 'A sharp blade' },
      'item',
      'item-1',
      worldId,
      userId,
    );
    queueImageGeneration(
      { name: 'Shield', description: 'Sturdy defense' },
      'item',
      'item-2',
      worldId,
      userId,
    );

    await vi.waitFor(
      async () => {
        const completed = await ImageTask.countDocuments({ status: 'completed' });
        expect(completed).toBe(2);
      },
      { timeout: 5000 },
    );

    expect(generateImage).toHaveBeenCalledTimes(2);
  });

  it('uses entity details as world context when world document is missing', async () => {
    const fakeWorldId = new mongoose.Types.ObjectId().toString();

    queueImageGeneration(
      { name: 'Lost World', description: 'A forgotten realm' },
      'world',
      'world-unknown',
      fakeWorldId,
      userId,
    );

    await vi.waitFor(
      () => {
        expect(generateImage).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Lost World' }),
          'world',
          'world-unknown',
          expect.objectContaining({ name: 'Lost World', genre: 'custom' }),
          expect.anything(),
        );
      },
      { timeout: 5000 },
    );
  });

  it('marks task pending for retry when generateImage fails below retry limit', async () => {
    vi.mocked(generateImage).mockRejectedValueOnce(new Error('provider down'));

    queueImageGeneration(
      { name: 'Retry Me', description: 'Fails once' },
      'character',
      'retry-1',
      worldId,
      userId,
    );

    await vi.waitFor(
      async () => {
        const task = await ImageTask.findOne({ entityId: 'retry-1' }).lean();
        expect(task?.status).toBe('pending');
        expect(task?.retryCount).toBe(1);
        expect(task?.error).toBe('provider down');
        expect(task?.nextRetryAt).toBeInstanceOf(Date);
      },
      { timeout: 5000 },
    );
  });

  it('marks task failed after third failure', async () => {
    vi.mocked(generateImage).mockRejectedValue(new Error('provider down'));
    const task = await ImageTask.create({
      entityDetails: { name: 'Done', description: 'No more retries' },
      entityType: 'character',
      entityId: 'fail-3',
      worldId,
      userId,
      status: 'pending',
      retryCount: 2,
    });

    queueImageGeneration(
      { name: 'Trigger', description: 'Starts queue scan' },
      'item',
      'trigger-1',
      worldId,
      userId,
    );

    await vi.waitFor(
      async () => {
        const failedTask = await ImageTask.findById(task._id).lean();
        expect(failedTask?.status).toBe('failed');
        expect(failedTask?.retryCount).toBe(3);
        expect(failedTask?.error).toBe('provider down');
      },
      { timeout: 5000 },
    );
  });

  it('keeps task retryable when no UserSettings found', async () => {
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    queueImageGeneration(
      { name: 'Ghost', description: 'No settings user' },
      'character',
      'ghost-1',
      worldId,
      fakeUserId,
    );

    await vi.waitFor(
      async () => {
        const task = await ImageTask.findOne({ entityId: 'ghost-1' }).lean();
        expect(task?.status).toBe('pending');
        expect(task?.retryCount).toBe(1);
        expect(task?.error).toContain('No settings found');
      },
      { timeout: 5000 },
    );

    expect(generateImage).not.toHaveBeenCalled();
    expect(createUserProviderRegistry).not.toHaveBeenCalled();
  });
});
