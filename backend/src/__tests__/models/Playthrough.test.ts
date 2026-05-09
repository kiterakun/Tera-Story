import mongoose from 'mongoose';
import { Playthrough } from '../../models/Playthrough';
import { User } from '../../models/User';
import { World } from '../../models/World';

describe('Playthrough model', () => {
  let userId: mongoose.Types.ObjectId;
  let worldId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    const user = await User.create({
      username: 'playuser',
      email: 'play@test.com',
      password: 'password123',
    });
    userId = user._id;

    const world = await World.create({
      name: 'PlayWorld',
      genre: 'fantasy',
      userId,
    });
    worldId = world._id;
  });

  it('creates playthrough with required fields', async () => {
    const pt = await Playthrough.create({
      name: 'My Adventure',
      worldId,
      userId,
    });
    expect(pt._id).toBeDefined();
    expect(pt.name).toBe('My Adventure');
    expect(String(pt.worldId)).toBe(String(worldId));
    expect(String(pt.userId)).toBe(String(userId));
  });

  it('defaults status to active', async () => {
    const pt = await Playthrough.create({
      name: 'DefaultStatus',
      worldId,
      userId,
    });
    expect(pt.status).toBe('active');
  });

  it('defaults currentArcIndex to 0', async () => {
    const pt = await Playthrough.create({
      name: 'DefaultArc',
      worldId,
      userId,
    });
    expect(pt.currentArcIndex).toBe(0);
  });

  it('fails when name is missing', async () => {
    await expect(
      Playthrough.create({ worldId, userId }),
    ).rejects.toThrow(/name/);
  });

  it('fails when worldId is missing', async () => {
    await expect(
      Playthrough.create({ name: 'NoWorld', userId }),
    ).rejects.toThrow(/worldId/);
  });

  it('fails when userId is missing', async () => {
    await expect(
      Playthrough.create({ name: 'NoUser', worldId }),
    ).rejects.toThrow(/userId/);
  });

  it('rejects invalid status enum', async () => {
    await expect(
      Playthrough.create({
        name: 'BadStatus',
        worldId,
        userId,
        status: 'finished',
      }),
    ).rejects.toThrow(/status/);
  });

  it('accepts all valid status enum values', async () => {
    const statuses = ['active', 'paused', 'completed'] as const;
    for (const s of statuses) {
      const pt = await Playthrough.create({
        name: `PT-${s}`,
        worldId,
        userId,
        status: s,
      });
      expect(pt.status).toBe(s);
    }
  });

  it('sets timestamps onCreate', async () => {
    const pt = await Playthrough.create({
      name: 'TimedPT',
      worldId,
      userId,
    });
    expect(pt.createdAt).toBeInstanceOf(Date);
    expect(pt.updatedAt).toBeInstanceOf(Date);
  });
});
