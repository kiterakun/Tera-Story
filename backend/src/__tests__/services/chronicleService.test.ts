import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { Playthrough } from '../../models/Playthrough';
import { Arc } from '../../models/Arc';
import { Chapter } from '../../models/Chapter';
import { User } from '../../models/User';
import {
  generateChronicleCache,
  getChronicle,
  generateShareId,
  getChronicleStats,
} from '../../services/chronicleService';

/** Insert a raw chapter document so arcIndex & combatResult survive Mongoose strict mode. */
async function insertChapter(
  playthroughId: string,
  arcId: mongoose.Types.ObjectId,
  arcIndex: number,
  chapterIndex: number,
  choices: Array<{ text: string; type: 'continue' | 'new_arc' | 'custom' }> = [],
  combatResult?: Record<string, unknown>
) {
  const doc: Record<string, unknown> = {
    playthroughId: new mongoose.Types.ObjectId(playthroughId),
    arcId,
    chapterIndex,
    status: 'completed',
    toolsStatus: 'completed',
    content: `Chapter ${chapterIndex} of arc ${arcIndex}`,
    choices,
  };
  if (arcIndex !== undefined) {
    doc.arcIndex = arcIndex;
  }
  if (combatResult) {
    doc.combatResult = combatResult;
  }
  return Chapter.collection.insertOne(doc);
}

describe('chronicleService', () => {
  let userId: mongoose.Types.ObjectId;
  let playthroughId: string;
  let emptyPlaythroughId: string;
  let firstArcId: mongoose.Types.ObjectId;
  let secondArcId: mongoose.Types.ObjectId;
  let createdAt: Date;
  let completedAt: Date;

  beforeAll(async () => {
    await User.syncIndexes();
    await Arc.syncIndexes();
    await Chapter.syncIndexes();
  });

  beforeEach(async () => {
    const user = await User.create({
      username: 'chronicle-service-user',
      email: 'chronicle-service@test.com',
      password: 'password123',
    });
    userId = user._id;

    // Fixed timestamps → predictable totalPlayTimeMinutes = 42
    createdAt = new Date('2026-05-12T10:00:00.000Z');
    completedAt = new Date('2026-05-12T10:42:00.000Z');

    const pt = await Playthrough.create({
      name: 'Chronicle Service Run',
      worldId: new mongoose.Types.ObjectId(),
      userId,
      status: 'completed',
      createdAt,
      completedAt,
    });
    playthroughId = pt._id.toString();

    // Override auto-assigned timestamps with exact values
    await Playthrough.updateOne(
      { _id: pt._id },
      { $set: { createdAt, completedAt } }
    );

    const emptyPt = await Playthrough.create({
      name: 'Empty Chronicle Service Run',
      worldId: new mongoose.Types.ObjectId(),
      userId,
      status: 'active',
    });
    emptyPlaythroughId = emptyPt._id.toString();

    const arc0 = await Arc.create({
      playthroughId: pt._id,
      arcIndex: 0,
      title: 'The Broken Gate',
      summary: 'Heroes enter through the broken gate.',
      status: 'completed',
    });
    const arc1 = await Arc.create({
      playthroughId: pt._id,
      arcIndex: 1,
      title: 'Ashen Crown',
      summary: 'The crown burns above the city.',
      status: 'completed',
    });
    firstArcId = arc0._id;
    secondArcId = arc1._id;

    // Arc 0 – 3 chapters (indices 0,1,2)
    await insertChapter(playthroughId, firstArcId, 0, 0, [
      { text: 'Enter gate', type: 'continue' },
      { text: 'Wait outside', type: 'custom' },
    ]);
    await insertChapter(playthroughId, firstArcId, 0, 1, [
      { text: 'Follow echo', type: 'continue' },
    ], { winner: 'hero' });
    await insertChapter(playthroughId, firstArcId, 0, 2, [
      { text: 'Climb wall', type: 'continue' },
      { text: 'Open tunnel', type: 'custom' },
    ]);

    // Arc 1 – 2 chapters (indices 0,1)
    await insertChapter(playthroughId, secondArcId, 1, 0, [
      { text: 'Claim crown', type: 'new_arc' },
    ], { winner: 'villain' });
    await insertChapter(playthroughId, secondArcId, 1, 1, [
      { text: 'Break crown', type: 'continue' },
      { text: 'Keep crown', type: 'custom' },
      { text: 'Hide crown', type: 'custom' },
    ]);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Playthrough.deleteMany({});
    await Arc.deleteMany({});
    await Chapter.collection.deleteMany({});
  });

  // ── generateChronicleCache ──────────────────────────────────────────

  describe('generateChronicleCache', () => {
    it('generates arc summaries with correct scene counts', async () => {
      const result = await generateChronicleCache(playthroughId);

      expect(result.chronicleCache).toBeTruthy();
      const summaries = result.chronicleCache!.arcSummaries;
      expect(summaries).toHaveLength(2);

      expect(summaries[0]).toMatchObject({
        arcId: firstArcId.toString(),
        title: 'The Broken Gate',
        summary: 'Heroes enter through the broken gate.',
        sceneCount: 3,
      });
      expect(summaries[1]).toMatchObject({
        arcId: secondArcId.toString(),
        title: 'Ashen Crown',
        summary: 'The crown burns above the city.',
        sceneCount: 2,
      });

      // keyScenes limited to first 5 chapters per arc
      expect(summaries[0]!.keyScenes).toHaveLength(3);
      expect(summaries[1]!.keyScenes).toHaveLength(2);
      // keyScenes use real chapter ObjectIds
      for (const ks of summaries[0]!.keyScenes) {
        expect(ks.sceneId).toMatch(/^[0-9a-f]{24}$/);
      }
    });

    it('returns playthrough without chronicleCache when no arcs exist', async () => {
      const result = await generateChronicleCache(emptyPlaythroughId);

      expect(result._id.toString()).toBe(emptyPlaythroughId);
      expect(result.chronicleCache).toBeNull();
    });

    it('calculates stats: totalScenes, totalChoices, totalCombats, totalPlayTimeMinutes', async () => {
      const result = await generateChronicleCache(playthroughId);

      expect(result.chronicleCache!.stats).toEqual({
        totalScenes: 5,          // 3 arc0 + 2 arc1
        totalChoices: 9,         // 2+1+2 + 1+3
        totalCombats: 2,         // arc0‑ch1 + arc1‑ch0
        totalPlayTimeMinutes: 42, // 10:00 → 10:42
      });
    });

    it('re‑generates cache when story data changes', async () => {
      await generateChronicleCache(playthroughId);

      // Add a new chapter to arc 1
      await insertChapter(playthroughId, secondArcId, 1, 2, [
        { text: 'Seal ashes', type: 'continue' },
      ]);

      const updated = await generateChronicleCache(playthroughId);

      expect(updated.chronicleCache!.arcSummaries[1]!.sceneCount).toBe(3);
      expect(updated.chronicleCache!.stats.totalScenes).toBe(6);
      expect(updated.chronicleCache!.stats.totalChoices).toBe(10);
    });

    it('throws when playthrough is not found', async () => {
      await expect(
        generateChronicleCache(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow('Playthrough not found');
    });
  });

  // ── getChronicle ────────────────────────────────────────────────────

  describe('getChronicle', () => {
    it('returns cached data when available', async () => {
      const cached = await generateChronicleCache(playthroughId);

      // Add a chapter AFTER caching — should NOT appear (no force)
      await insertChapter(playthroughId, secondArcId, 1, 2, [
        { text: 'Ignored chapter', type: 'continue' },
      ]);

      const chronicle = await getChronicle(playthroughId);

      expect(chronicle.playthroughName).toBe('Chronicle Service Run');
      expect(chronicle.status).toBe('completed');
      expect(chronicle.completedAt).toBeTruthy();
      // Should return the old cached stats, not the new chapter
      expect(chronicle.chronicle!.stats.totalScenes).toBe(5);
      expect(chronicle.chronicle).toEqual(cached.chronicleCache);
    });

    it('regenerates when forceRegenerate is true', async () => {
      await generateChronicleCache(playthroughId);

      await insertChapter(playthroughId, secondArcId, 1, 2, [
        { text: 'Count after force', type: 'continue' },
      ]);

      const chronicle = await getChronicle(playthroughId, true);

      expect(chronicle.chronicle!.stats.totalScenes).toBe(6);
      expect(chronicle.chronicle!.arcSummaries[1]!.sceneCount).toBe(3);
    });

    it('regenerates when arc count exceeds cached arc count', async () => {
      await generateChronicleCache(playthroughId); // cachedArcCount = 2

      // Add a third arc
      await Arc.create({
        playthroughId: new mongoose.Types.ObjectId(playthroughId),
        arcIndex: 2,
        title: 'Third Arc',
        status: 'completed',
      });
      await insertChapter(playthroughId, new mongoose.Types.ObjectId(), 2, 0, [
        { text: 'Third arc chapter', type: 'continue' },
      ]);

      // no force → should auto‑regenerate because arcCount (3) > cachedArcCount (2)
      const chronicle = await getChronicle(playthroughId);

      expect(chronicle.chronicle!.arcSummaries).toHaveLength(3);
      expect(chronicle.chronicle!.stats.totalScenes).toBe(6);
    });

    it('throws when playthrough is not found', async () => {
      await expect(
        getChronicle(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow('Playthrough not found');
    });
  });

  // ── generateShareId ─────────────────────────────────────────────────

  describe('generateShareId', () => {
    it('returns unique UUID‑formatted hash values', async () => {
      const first = await generateShareId(playthroughId);
      const second = await generateShareId(playthroughId);

      expect(first).not.toBe(second);
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(first).toMatch(uuidRe);
      expect(second).toMatch(uuidRe);
    });

    it('stores share ID on the playthrough document', async () => {
      const shareId = await generateShareId(playthroughId);
      const pt = await Playthrough.findById(playthroughId).lean().orFail();

      expect(pt.shareId).toBe(shareId);
    });
  });

  // ── getChronicleStats ───────────────────────────────────────────────

  describe('getChronicleStats', () => {
    it('returns cached stats with completion percent when completed', async () => {
      // Pre‑generate cache
      await generateChronicleCache(playthroughId);

      const stats = await getChronicleStats(playthroughId);

      expect(stats).toEqual({
        totalScenes: 5,
        totalChoices: 9,
        totalCombats: 2,
        totalPlayTimeMinutes: 42,
        completionPercent: 100,
      });
    });

    it('throws when playthrough is not found', async () => {
      await expect(
        getChronicleStats(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow('Playthrough not found');
    });
  });
});
