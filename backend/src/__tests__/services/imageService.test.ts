import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { queueImageGeneration } from '../../services/imageService';
import { UserSettings } from '../../models/UserSettings';
import { World } from '../../models/World';
import { User } from '../../models/User';
import { generateImage } from '../../agents/imageAgent';
import { createUserProviderRegistry } from '../../providers/registry';

// Mock external deps that touch the network / filesystem
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
    // Sync indexes so unique constraints are enforced in test MongoDB
    await User.syncIndexes();
    await UserSettings.syncIndexes();
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

  it('adds job and calls generateImage for the first queued item', async () => {
    // queueImageGeneration is synchronous, but processQueue is async and started immediately.
    // We must wait a tick for the async processQueue to consume the job.
    queueImageGeneration(
      { name: 'Aria', description: 'A brave knight' },
      'character',
      'char-1',
      worldId,
      userId,
    );

    // Let the microtask queue drain so processQueue runs
    await vi.waitFor(
      () => {
        expect(generateImage).toHaveBeenCalledTimes(1);
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

  it('processes multiple jobs sequentially', async () => {
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
      () => {
        expect(generateImage).toHaveBeenCalledTimes(2);
      },
      { timeout: 5000 },
    );
  });

  it('handles World not found gracefully (uses entity details for world type)', async () => {
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
        const calls = vi.mocked(generateImage).mock.calls;
        const worldCall = calls.find(
          (call) => call[2] === 'world-unknown',
        );
        expect(worldCall).toBeDefined();
      },
      { timeout: 5000 },
    );

    // Should have used entityDetails for world context fallback
    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Lost World' }),
      'world',
      'world-unknown',
      expect.objectContaining({ name: 'Lost World', genre: 'custom' }),
      expect.anything(),
    );
  });

  it('skips gracefully when no UserSettings found', async () => {
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    queueImageGeneration(
      { name: 'Ghost', description: 'No settings user' },
      'character',
      'ghost-1',
      worldId,
      fakeUserId,
    );

    // Should not throw; generateImage should not be called for this user
    await new Promise((resolve) => setTimeout(resolve, 500));

    // generateImage was already called from previous tests; ensure it wasn't called with ghost userId stuff
    // We can check that no error was thrown; test passes if it reaches here.
    // Actually, verify that the mock was not called with the ghost entityId
    const calls = vi.mocked(generateImage).mock.calls;
    const ghostCall = calls.find(
      (call) => call[2] === 'ghost-1',
    );
    expect(ghostCall).toBeUndefined();
  });
});
