/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { StoryCard } from '../../models/StoryCard';

const createValidStoryCardData = () => ({
  userId: new mongoose.Types.ObjectId(),
  playthroughId: new mongoose.Types.ObjectId(),
  worldId: new mongoose.Types.ObjectId(),
  sceneId: new mongoose.Types.ObjectId(),
  choiceId: new mongoose.Types.ObjectId(),
  imageUrl: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  title: 'The Crystal Gate',
  description: 'A pivotal scene where the hero opens the ancient gate.',
  rarity: 'rare' as const,
  category: 'story' as const,
  unlockedAt: new Date('2026-01-01T00:00:00.000Z'),
  shared: true,
  shareCount: 3,
  publicShareUrl: 'crystal-gate-001',
});

describe('StoryCard Model', () => {
  beforeEach(async () => {
    await StoryCard.syncIndexes();
  });

  it('should create a valid StoryCard with all fields', async () => {
    const data = createValidStoryCardData();
    const card = await StoryCard.create(data);

    expect(card._id).toBeDefined();
    expect(String(card.userId)).toBe(String(data.userId));
    expect(String(card.playthroughId)).toBe(String(data.playthroughId));
    expect(String(card.worldId)).toBe(String(data.worldId));
    expect(String(card.sceneId)).toBe(String(data.sceneId));
    expect(String(card.choiceId)).toBe(String(data.choiceId));
    expect(card.imageUrl).toBe(data.imageUrl);
    expect(card.thumbnailUrl).toBe(data.thumbnailUrl);
    expect(card.title).toBe(data.title);
    expect(card.description).toBe(data.description);
    expect(card.rarity).toBe(data.rarity);
    expect(card.category).toBe(data.category);
    expect(card.unlockedAt.toISOString()).toBe(data.unlockedAt.toISOString());
    expect(card.shared).toBe(data.shared);
    expect(card.shareCount).toBe(data.shareCount);
    expect(card.publicShareUrl).toBe(data.publicShareUrl);
  });

  const requiredFields = [
    'userId',
    'playthroughId',
    'worldId',
    'sceneId',
    'imageUrl',
    'title',
    'description',
    'rarity',
    'category',
  ] as const;

  it.each(requiredFields)('should require %s', async (field) => {
    const data = createValidStoryCardData();
    delete data[field];

    await expect(StoryCard.create(data)).rejects.toThrow(new RegExp(field));
  });

  const validRarities = ['common', 'uncommon', 'rare', 'epic'] as const;

  it.each(validRarities)('should accept rarity "%s"', async (rarity) => {
    const card = await StoryCard.create({
      ...createValidStoryCardData(),
      sceneId: new mongoose.Types.ObjectId(),
      publicShareUrl: `rarity-${rarity}`,
      rarity,
    });

    expect(card.rarity).toBe(rarity);
  });

  it('should reject invalid rarity', async () => {
    await expect(
      StoryCard.create({
        ...createValidStoryCardData(),
        rarity: 'legendary',
      }),
    ).rejects.toThrow(/rarity/);
  });

  const validCategories = ['story', 'combat', 'character', 'discovery', 'milestone'] as const;

  it.each(validCategories)('should accept category "%s"', async (category) => {
    const card = await StoryCard.create({
      ...createValidStoryCardData(),
      sceneId: new mongoose.Types.ObjectId(),
      publicShareUrl: `category-${category}`,
      category,
    });

    expect(card.category).toBe(category);
  });

  it('should reject invalid category', async () => {
    await expect(
      StoryCard.create({
        ...createValidStoryCardData(),
        category: 'romance',
      }),
    ).rejects.toThrow(/category/);
  });

  it('should allow optional choiceId and thumbnailUrl to be undefined', async () => {
    const { choiceId: _choiceId, thumbnailUrl: _thumbnailUrl, ...data } = createValidStoryCardData();
    const card = await StoryCard.create(data);

    expect(card.choiceId).toBeUndefined();
    expect(card.thumbnailUrl).toBeUndefined();
  });

  it('should apply defaults for shared, shareCount, publicShareUrl, and unlockedAt', async () => {
    const {
      shared: _shared,
      shareCount: _shareCount,
      publicShareUrl: _publicShareUrl,
      unlockedAt: _unlockedAt,
      ...data
    } = createValidStoryCardData();
    const beforeCreate = Date.now();
    const card = await StoryCard.create(data);
    const afterCreate = Date.now();

    expect(card.shared).toBe(false);
    expect(card.shareCount).toBe(0);
    expect(card.publicShareUrl).toBeUndefined();
    expect(card.unlockedAt).toBeInstanceOf(Date);
    expect(card.unlockedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
    expect(card.unlockedAt.getTime()).toBeLessThanOrEqual(afterCreate);
  });

  it('should enforce unique compound index on playthroughId and sceneId', async () => {
    const playthroughId = new mongoose.Types.ObjectId();
    const sceneId = new mongoose.Types.ObjectId();

    await StoryCard.create({
      ...createValidStoryCardData(),
      playthroughId,
      sceneId,
      publicShareUrl: 'first-card',
    });

    await expect(
      StoryCard.create({
        ...createValidStoryCardData(),
        playthroughId,
        sceneId,
        publicShareUrl: 'second-card',
      }),
    ).rejects.toThrow(/duplicate key/);
  });

  it('should allow multiple cards with undefined publicShareUrl through sparse unique index', async () => {
    const firstData = createValidStoryCardData();
    const secondData = createValidStoryCardData();
    const { publicShareUrl: _firstPublicShareUrl, ...firstCardData } = firstData;
    const { publicShareUrl: _secondPublicShareUrl, ...secondCardData } = secondData;

    const firstCard = await StoryCard.create(firstCardData);
    const secondCard = await StoryCard.create(secondCardData);

    expect(firstCard.publicShareUrl).toBeUndefined();
    expect(secondCard.publicShareUrl).toBeUndefined();
  });

  it('should enforce unique sparse index on publicShareUrl when defined', async () => {
    await StoryCard.create({
      ...createValidStoryCardData(),
      publicShareUrl: 'abc123',
    });

    await expect(
      StoryCard.create({
        ...createValidStoryCardData(),
        publicShareUrl: 'abc123',
      }),
    ).rejects.toThrow(/duplicate key/);
  });

  it('should auto-generate timestamps', async () => {
    const beforeCreate = Date.now();
    const card = await StoryCard.create(createValidStoryCardData());
    const afterCreate = Date.now();

    expect(card.createdAt).toBeInstanceOf(Date);
    expect(card.updatedAt).toBeInstanceOf(Date);
    expect(card.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
    expect(card.createdAt.getTime()).toBeLessThanOrEqual(afterCreate);
    expect(card.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
    expect(card.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate);
  });
});
