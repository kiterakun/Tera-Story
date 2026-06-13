/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { WhispersCache } from '../../models/WhispersCache';

const createValidWhisper = (overrides?: {
  type?: string;
  content?: string;
  relatedEntityType?: string;
  relatedEntityId?: mongoose.Types.ObjectId;
  attribution?: string;
}) => ({
  type: 'rumor' as const,
  content: 'A'.repeat(50),
  ...overrides,
});

const createValidWhispersCacheData = () => ({
  playthroughId: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  whispers: [
    createValidWhisper({ type: 'rumor', content: 'A'.repeat(50), attribution: 'Town Crier' }),
    createValidWhisper({ type: 'news', content: 'B'.repeat(50), attribution: 'Herald' }),
    createValidWhisper({ type: 'diary', content: 'C'.repeat(50) }),
  ],
  generatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('WhispersCache Model', () => {
  beforeEach(async () => {
    await WhispersCache.syncIndexes();
  });

  // === Valid Creation ===
  it('should create a valid WhispersCache with 3 whispers (minimum)', async () => {
    const data = createValidWhispersCacheData();
    const cache = await WhispersCache.create(data);

    expect(cache._id).toBeDefined();
    expect(String(cache.playthroughId)).toBe(String(data.playthroughId));
    expect(String(cache.userId)).toBe(String(data.userId));
    expect(cache.whispers).toHaveLength(3);
    expect(cache.generatedAt.toISOString()).toBe(data.generatedAt.toISOString());
    expect(cache.expiresAt).toBeInstanceOf(Date);
    expect(cache.viewedAt).toBeNull();
  });

  it('should create a valid WhispersCache with 4 whispers', async () => {
    const data = createValidWhispersCacheData();
    data.whispers.push(createValidWhisper({ type: 'letter', content: 'D'.repeat(50) }));

    const cache = await WhispersCache.create(data);
    expect(cache.whispers).toHaveLength(4);
  });

  it('should create a valid WhispersCache with 5 whispers (maximum)', async () => {
    const data = createValidWhispersCacheData();
    data.whispers.push(
      createValidWhisper({ type: 'letter', content: 'D'.repeat(50) }),
      createValidWhisper({ type: 'rumor', content: 'E'.repeat(50) }),
    );

    const cache = await WhispersCache.create(data);
    expect(cache.whispers).toHaveLength(5);
  });

  // === Required Fields ===
  const requiredFields = ['playthroughId', 'userId', 'whispers', 'generatedAt'] as const;

  it.each(requiredFields)('should require %s', async (field) => {
    const data = createValidWhispersCacheData() as Record<string, unknown>;
    delete data[field];

    await expect(WhispersCache.create(data)).rejects.toThrow(new RegExp(field));
  });

  // === Whisper Type Enum ===
  const validWhisperTypes = ['rumor', 'letter', 'diary', 'news'] as const;

  it.each(validWhisperTypes)('should accept whisper type "%s"', async (type) => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.type = type;

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.type).toBe(type);
  });

  it('should reject invalid whisper type', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.type = 'invalid_type' as string;

    await expect(WhispersCache.create(data)).rejects.toThrow(/type/);
  });

  // === Whisper Content Validation ===
  it('should require whisper content', async () => {
    const data = createValidWhispersCacheData();
    delete (data.whispers[0] as Record<string, unknown>).content;

    await expect(WhispersCache.create(data)).rejects.toThrow(/content/);
  });

  it('should reject whisper content shorter than 50 characters', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.content = 'A'.repeat(49);

    await expect(WhispersCache.create(data)).rejects.toThrow(/content/);
  });

  it('should accept whisper content at exactly 50 characters (minimum boundary)', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.content = 'A'.repeat(50);

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.content).toHaveLength(50);
  });

  it('should reject whisper content longer than 500 characters', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.content = 'A'.repeat(501);

    await expect(WhispersCache.create(data)).rejects.toThrow(/content/);
  });

  it('should accept whisper content at exactly 500 characters (maximum boundary)', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.content = 'A'.repeat(500);

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.content).toHaveLength(500);
  });

  // === Whisper Array Length Validation ===
  it('should reject whispers array with 2 items (below minimum of 3)', async () => {
    const data = createValidWhispersCacheData();
    data.whispers = [
      createValidWhisper({ type: 'rumor', content: 'A'.repeat(50) }),
      createValidWhisper({ type: 'news', content: 'B'.repeat(50) }),
    ];

    await expect(WhispersCache.create(data)).rejects.toThrow(/3-5/);
  });

  it('should reject whispers array with 6 items (above maximum of 5)', async () => {
    const data = createValidWhispersCacheData();
    data.whispers = [
      createValidWhisper({ type: 'rumor', content: 'A'.repeat(50) }),
      createValidWhisper({ type: 'news', content: 'B'.repeat(50) }),
      createValidWhisper({ type: 'diary', content: 'C'.repeat(50) }),
      createValidWhisper({ type: 'letter', content: 'D'.repeat(50) }),
      createValidWhisper({ type: 'rumor', content: 'E'.repeat(50) }),
      createValidWhisper({ type: 'news', content: 'F'.repeat(50) }),
    ];

    await expect(WhispersCache.create(data)).rejects.toThrow(/3-5/);
  });

  // === Whisper relatedEntityType Enum ===
  const validEntityTypes = ['character', 'location', 'item', 'arc'] as const;

  it.each(validEntityTypes)('should accept relatedEntityType "%s"', async (entityType) => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.relatedEntityType = entityType;

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.relatedEntityType).toBe(entityType);
  });

  it('should reject invalid relatedEntityType', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.relatedEntityType = 'invalid_entity' as string;

    await expect(WhispersCache.create(data)).rejects.toThrow(/relatedEntityType/);
  });

  it('should allow relatedEntityType to be undefined', async () => {
    const data = createValidWhispersCacheData();

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.relatedEntityType).toBeUndefined();
  });

  // === Whisper relatedEntityId Optional ===
  it('should allow optional relatedEntityId to be set', async () => {
    const entityId = new mongoose.Types.ObjectId();
    const data = createValidWhispersCacheData();
    data.whispers[0]!.relatedEntityId = entityId;

    const cache = await WhispersCache.create(data);
    expect(String(cache.whispers[0]!.relatedEntityId)).toBe(String(entityId));
  });

  it('should allow relatedEntityId to be undefined', async () => {
    const data = createValidWhispersCacheData();

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.relatedEntityId).toBeUndefined();
  });

  // === Whisper Attribution Validation ===
  it('should accept attribution up to 100 characters', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.attribution = 'A'.repeat(100);

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.attribution).toHaveLength(100);
  });

  it('should reject attribution longer than 100 characters', async () => {
    const data = createValidWhispersCacheData();
    data.whispers[0]!.attribution = 'A'.repeat(101);

    await expect(WhispersCache.create(data)).rejects.toThrow(/attribution/);
  });

  it('should allow attribution to be undefined', async () => {
    const data = createValidWhispersCacheData();
    delete data.whispers[0]!.attribution;

    const cache = await WhispersCache.create(data);
    expect(cache.whispers[0]!.attribution).toBeUndefined();
  });

  // === Pre-Save Hook: expiresAt = generatedAt + 7 days ===
  it('should auto-set expiresAt to generatedAt + 7 days on create', async () => {
    const genDate = new Date('2026-01-01T00:00:00.000Z');
    const expectedExpiry = new Date('2026-01-08T00:00:00.000Z');

    const cache = await WhispersCache.create({
      ...createValidWhispersCacheData(),
      generatedAt: genDate,
    });

    expect(cache.expiresAt.toISOString()).toBe(expectedExpiry.toISOString());
  });

  it('should update expiresAt when generatedAt is modified', async () => {
    const genDate1 = new Date('2026-01-01T00:00:00.000Z');
    const expectedExpiry1 = new Date('2026-01-08T00:00:00.000Z');

    const cache = await WhispersCache.create({
      ...createValidWhispersCacheData(),
      generatedAt: genDate1,
    });
    expect(cache.expiresAt.toISOString()).toBe(expectedExpiry1.toISOString());

    // Modify generatedAt and save again — pre-save hook should fire
    const genDate2 = new Date('2026-06-15T00:00:00.000Z');
    const expectedExpiry2 = new Date('2026-06-22T00:00:00.000Z');
    cache.generatedAt = genDate2;
    await cache.save();

    expect(cache.expiresAt.toISOString()).toBe(expectedExpiry2.toISOString());
  });

  // === viewedAt Default ===
  it('should default viewedAt to null', async () => {
    const cache = await WhispersCache.create(createValidWhispersCacheData());
    expect(cache.viewedAt).toBeNull();
  });

  it('should allow setting viewedAt explicitly', async () => {
    const viewDate = new Date('2026-01-05T12:00:00.000Z');
    const cache = await WhispersCache.create({
      ...createValidWhispersCacheData(),
      viewedAt: viewDate,
    });

    expect(cache.viewedAt!.toISOString()).toBe(viewDate.toISOString());
  });

  // === Unique Index on playthroughId ===
  it('should enforce unique index on playthroughId', async () => {
    const playthroughId = new mongoose.Types.ObjectId();

    await WhispersCache.create({
      ...createValidWhispersCacheData(),
      playthroughId,
    });

    await expect(
      WhispersCache.create({
        ...createValidWhispersCacheData(),
        playthroughId,
      }),
    ).rejects.toThrow(/duplicate key/);
  });

  // === TTL Index on expiresAt ===
  it('should have a TTL index on expiresAt', () => {
    const indexes = WhispersCache.schema.indexes();
    const ttlIndex = indexes.find(
      (idx: any) => idx[0] && (idx[0] as Record<string, unknown>).expiresAt === 1,
    );

    expect(ttlIndex).toBeDefined();
    expect(ttlIndex![1]).toHaveProperty('expireAfterSeconds', 0);
  });

  // === Timestamps ===
  it('should auto-generate timestamps via timestamps:true', async () => {
    const beforeCreate = Date.now();
    const cache = await WhispersCache.create(createValidWhispersCacheData());
    const afterCreate = Date.now();

    expect(cache.createdAt).toBeInstanceOf(Date);
    expect(cache.updatedAt).toBeInstanceOf(Date);
    expect(cache.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
    expect(cache.createdAt.getTime()).toBeLessThanOrEqual(afterCreate);
    expect(cache.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
    expect(cache.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate);
  });
});
