/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Echo } from '../../models/Echo';

describe('Echo Model', () => {
  const validEchoData = {
    playthroughId: new mongoose.Types.ObjectId(),
    triggerChapterId: new mongoose.Types.ObjectId(),
    triggerChapterIndex: 1,
    targetChapterIndex: 10,
    type: 'mercy',
    description: 'Test echo description',
    minChapterDelay: 10,
    maxChapterDelay: 15,
  } as const;

  beforeEach(async () => {
    await Echo.syncIndexes();
  });

  it('should create a valid echo', async () => {
    const echo = await Echo.create(validEchoData);

    expect(echo._id).toBeDefined();
    expect(String(echo.playthroughId)).toBe(String(validEchoData.playthroughId));
    expect(String(echo.triggerChapterId)).toBe(String(validEchoData.triggerChapterId));
    expect(echo.triggerChapterIndex).toBe(validEchoData.triggerChapterIndex);
    expect(echo.targetChapterIndex).toBe(validEchoData.targetChapterIndex);
    expect(echo.type).toBe(validEchoData.type);
    expect(echo.description).toBe(validEchoData.description);
    expect(echo.minChapterDelay).toBe(validEchoData.minChapterDelay);
    expect(echo.maxChapterDelay).toBe(validEchoData.maxChapterDelay);
  });

  it('should require playthroughId', async () => {
    const { playthroughId: _playthroughId, ...data } = validEchoData;

    await expect(Echo.create(data)).rejects.toThrow(/playthroughId/);
  });

  it('should require triggerChapterId', async () => {
    const { triggerChapterId: _triggerChapterId, ...data } = validEchoData;

    await expect(Echo.create(data)).rejects.toThrow(/triggerChapterId/);
  });

  it('should require triggerChapterIndex', async () => {
    const { triggerChapterIndex: _triggerChapterIndex, ...data } = validEchoData;

    await expect(Echo.create(data)).rejects.toThrow(/triggerChapterIndex/);
  });

  it('should require targetChapterIndex', async () => {
    const { targetChapterIndex: _targetChapterIndex, ...data } = validEchoData;

    await expect(Echo.create(data)).rejects.toThrow(/targetChapterIndex/);
  });

  it('should require type', async () => {
    const { type: _type, ...data } = validEchoData;

    await expect(Echo.create(data)).rejects.toThrow(/type/);
  });

  it('should require description', async () => {
    const { description: _description, ...data } = validEchoData;

    await expect(Echo.create(data)).rejects.toThrow(/description/);
  });

  it('should require minChapterDelay', () => {
    const path = Echo.schema.path('minChapterDelay') as mongoose.SchemaTypeOptions<unknown>;

    expect(path).toBeDefined();
    expect(path.required).toBeDefined();
  });

  it('should require maxChapterDelay', () => {
    const path = Echo.schema.path('maxChapterDelay') as mongoose.SchemaTypeOptions<unknown>;

    expect(path).toBeDefined();
    expect(path.required).toBeDefined();
  });

  it('should accept all valid type enum values', async () => {
    const types = ['mercy', 'betrayal', 'discovery', 'consequence'] as const;

    for (const type of types) {
      const echo = await Echo.create({
        ...validEchoData,
        playthroughId: new mongoose.Types.ObjectId(),
        triggerChapterId: new mongoose.Types.ObjectId(),
        type,
      });

      expect(echo.type).toBe(type);
    }
  });

  it('should reject invalid type enum values', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        type: 'forgiveness',
      }),
    ).rejects.toThrow(/type/);
  });

  it('should default status to planted', async () => {
    const echo = await Echo.create(validEchoData);

    expect(echo.status).toBe('planted');
  });

  it('should accept all valid status enum values', async () => {
    const statuses = ['planted', 'approaching', 'active', 'resolved'] as const;

    for (const status of statuses) {
      const echo = await Echo.create({
        ...validEchoData,
        playthroughId: new mongoose.Types.ObjectId(),
        triggerChapterId: new mongoose.Types.ObjectId(),
        status,
      });

      expect(echo.status).toBe(status);
    }
  });

  it('should reject invalid status enum values', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        status: 'expired',
      }),
    ).rejects.toThrow(/status/);
  });

  it('should enforce minChapterDelay minimum of 5', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        minChapterDelay: 4,
      }),
    ).rejects.toThrow(/minChapterDelay/);
  });

  it('should enforce minChapterDelay maximum of 20', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        minChapterDelay: 21,
      }),
    ).rejects.toThrow(/minChapterDelay/);
  });

  it('should accept minChapterDelay boundary values', async () => {
    const minimum = await Echo.create({
      ...validEchoData,
      playthroughId: new mongoose.Types.ObjectId(),
      triggerChapterId: new mongoose.Types.ObjectId(),
      minChapterDelay: 5,
    });
    const maximum = await Echo.create({
      ...validEchoData,
      playthroughId: new mongoose.Types.ObjectId(),
      triggerChapterId: new mongoose.Types.ObjectId(),
      minChapterDelay: 20,
    });

    expect(minimum.minChapterDelay).toBe(5);
    expect(maximum.minChapterDelay).toBe(20);
  });

  it('should enforce maxChapterDelay minimum of 10', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        maxChapterDelay: 9,
      }),
    ).rejects.toThrow(/maxChapterDelay/);
  });

  it('should enforce maxChapterDelay maximum of 25', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        maxChapterDelay: 26,
      }),
    ).rejects.toThrow(/maxChapterDelay/);
  });

  it('should accept maxChapterDelay boundary values', async () => {
    const minimum = await Echo.create({
      ...validEchoData,
      playthroughId: new mongoose.Types.ObjectId(),
      triggerChapterId: new mongoose.Types.ObjectId(),
      maxChapterDelay: 10,
    });
    const maximum = await Echo.create({
      ...validEchoData,
      playthroughId: new mongoose.Types.ObjectId(),
      triggerChapterId: new mongoose.Types.ObjectId(),
      maxChapterDelay: 25,
    });

    expect(minimum.maxChapterDelay).toBe(10);
    expect(maximum.maxChapterDelay).toBe(25);
  });

  it('should enforce targetChapterIndex minimum of 0', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        targetChapterIndex: -1,
      }),
    ).rejects.toThrow(/targetChapterIndex/);
  });

  it('should accept targetChapterIndex of 0', async () => {
    const echo = await Echo.create({
      ...validEchoData,
      targetChapterIndex: 0,
    });

    expect(echo.targetChapterIndex).toBe(0);
  });

  it('should enforce triggerChapterIndex minimum of 0', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        triggerChapterIndex: -1,
      }),
    ).rejects.toThrow(/triggerChapterIndex/);
  });

  it('should accept triggerChapterIndex of 0', async () => {
    const echo = await Echo.create({
      ...validEchoData,
      triggerChapterIndex: 0,
    });

    expect(echo.triggerChapterIndex).toBe(0);
  });

  it('should enforce description maxlength of 500', async () => {
    await expect(
      Echo.create({
        ...validEchoData,
        description: 'a'.repeat(501),
      }),
    ).rejects.toThrow(/description/);
  });

  it('should accept description with 500 characters', async () => {
    const echo = await Echo.create({
      ...validEchoData,
      description: 'a'.repeat(500),
    });

    expect(echo.description).toHaveLength(500);
  });

  it('should default narrative to empty string', async () => {
    const echo = await Echo.create(validEchoData);

    expect(echo.narrative).toBe('');
  });

  it('should default resolvedAt to null', async () => {
    const echo = await Echo.create(validEchoData);

    expect(echo.resolvedAt).toBeNull();
  });

  it('should auto-generate timestamps', async () => {
    const echo = await Echo.create(validEchoData);

    expect(echo.createdAt).toBeInstanceOf(Date);
    expect(echo.updatedAt).toBeInstanceOf(Date);
  });

  it('should fail on duplicate playthroughId, triggerChapterId, and type compound index', async () => {
    await Echo.create(validEchoData);

    await expect(Echo.create(validEchoData)).rejects.toThrow(/duplicate key/i);
  });
});
