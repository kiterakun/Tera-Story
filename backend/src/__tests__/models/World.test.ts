import mongoose from 'mongoose';
import { World } from '../../models/World';
import { User } from '../../models/User';

describe('World model', () => {
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    const user = await User.create({
      username: 'worldowner',
      email: 'worldowner@test.com',
      password: 'password123',
    });
    userId = user._id;
  });


  it('creates world with all required fields', async () => {
    const world = await World.create({
      name: 'Eldoria',
      description: 'A land of ancient magic.',
      genre: 'fantasy',
      userId,
    });
    expect(world._id).toBeDefined();
    expect(world.name).toBe('Eldoria');
    expect(world.genre).toBe('fantasy');
    expect(String(world.userId)).toBe(String(userId));
  });

  it('defaults description to empty string', async () => {
    const world = await World.create({
      name: 'MinimalWorld',
      genre: 'sci-fi',
      userId,
    });
    expect(world.description).toBe('');
  });

  it('defaults resourceTemplates to empty array', async () => {
    const world = await World.create({
      name: 'NoTemplates',
      genre: 'modern',
      userId,
    });
    expect(world.resourceTemplates).toEqual([]);
  });

  it('fails when name is missing', async () => {
    await expect(
      World.create({ description: 'desc', genre: 'fantasy', userId }),
    ).rejects.toThrow(/name/);
  });

  it('fails when genre is missing', async () => {
    await expect(
      World.create({ name: 'test', userId }),
    ).rejects.toThrow(/genre/);
  });

  it('fails when genre is invalid enum', async () => {
    await expect(
      World.create({
        name: 'Invalid',
        genre: 'horror',
        userId,
      }),
    ).rejects.toThrow(/genre/);
  });

  it('fails when userId is missing', async () => {
    await expect(
      World.create({ name: 'Orphan', genre: 'fantasy' }),
    ).rejects.toThrow(/userId/);
  });

  it('accepts all valid genre enum values', async () => {
    const genres = ['fantasy', 'sci-fi', 'wuxia', 'modern', 'custom'] as const;
    for (const g of genres) {
      const world = await World.create({
        name: `World-${g}`,
        genre: g,
        userId,
      });
      expect(world.genre).toBe(g);
    }
  });

  it('trims name whitespace', async () => {
    const world = await World.create({
      name: '  Trimmed  ',
      genre: 'fantasy',
      userId,
    });
    expect(world.name).toBe('Trimmed');
  });

  it('validates resourceTemplate fields', async () => {
    const world = await World.create({
      name: 'WithResources',
      genre: 'fantasy',
      userId,
      resourceTemplates: [
        { key: 'mana', type: 'number', min: 0, max: 100, defaultValue: 50 },
      ],
    });
    expect(world.resourceTemplates).toHaveLength(1);
    expect(world.resourceTemplates[0].key).toBe('mana');
    expect(world.resourceTemplates[0].type).toBe('number');
  });

  it('rejects resourceTemplate with invalid type enum', async () => {
    await expect(
      World.create({
        name: 'BadTemplate',
        genre: 'fantasy',
        userId,
        resourceTemplates: [{ key: 'gold', type: 'currency' }],
      }),
    ).rejects.toThrow(/type/);
  });

  it('sets timestamps onCreate', async () => {
    const world = await World.create({
      name: 'Timestamped',
      genre: 'sci-fi',
      userId,
    });
    expect(world.createdAt).toBeInstanceOf(Date);
    expect(world.updatedAt).toBeInstanceOf(Date);
  });
});
