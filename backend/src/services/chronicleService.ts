import { Playthrough } from '../models/Playthrough';
import { Arc } from '../models/Arc';
import { Chapter } from '../models/Chapter';
import type { IPlaythroughDocument } from '../models/Playthrough';
import crypto from 'crypto';

interface IArcSummary {
  arcId: string;
  title: string;
  summary: string;
  sceneCount: number;
  keyScenes: IKeyScene[];
}

interface IKeyScene {
  sceneId: string;
  title: string;
  thumbnailUrl?: string;
}

interface IChronicleStats {
  totalScenes: number;
  totalChoices: number;
  totalCombats: number;
  totalPlayTimeMinutes: number;
}

export async function generateChronicleCache(playthroughId: string): Promise<IPlaythroughDocument> {
  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');

  const arcs = await Arc.find({ playthroughId }).sort({ arcIndex: 1 }).lean();

  if (arcs.length === 0) {
    // Return playthrough without chronicle cache — will show empty state in frontend
    return playthrough;
  }

  const arcSummaries: IArcSummary[] = await Promise.all(
    arcs.map(async (arc) => {
      const chapters = await Chapter.find({
        playthroughId,
        arcIndex: arc.arcIndex,
      })
        .sort({ chapterIndex: 1 })
        .lean();

      const keyScenes: IKeyScene[] = chapters.slice(0, 5).map((ch) => ({
        sceneId: ch._id.toString(),
        title: `Scene ${ch.chapterIndex}`,
      }));

      return {
        arcId: arc._id.toString(),
        title: arc.title,
        summary: arc.summary ?? `Arc ${arc.arcIndex + 1}: ${arc.title}`,
        sceneCount: chapters.length,
        keyScenes,
      };
    })
  );

  // Count total scenes, choices, and combats across all chapters
  let totalScenes = 0;
  let totalChoices = 0;
  let totalCombats = 0;

  const allChapters = await Chapter.find({ playthroughId }).lean();
  for (const ch of allChapters) {
    totalScenes++;
    if (ch.choices && Array.isArray(ch.choices)) {
      totalChoices += ch.choices.length;
    }
    // Combat encounters may be referenced but not stored as numbers
    if ((ch as unknown as Record<string, unknown>).combatResult) {
      totalCombats++;
    }
  }

  // Estimate play time from playthrough timestamps
  const createdAt = playthrough.createdAt.getTime();
  const completedAt = playthrough.completedAt
    ? playthrough.completedAt.getTime()
    : Date.now();
  const totalPlayTimeMinutes = Math.round((completedAt - createdAt) / 60000);

  const stats: IChronicleStats = {
    totalScenes,
    totalChoices,
    totalCombats,
    totalPlayTimeMinutes,
  };

  const chronicleCache = {
    generatedAt: new Date(),
    arcSummaries,
    stats,
  };

  const updated = await Playthrough.findByIdAndUpdate(
    playthroughId,
    { $set: { chronicleCache } },
    { returnDocument: 'after' }
  );

  if (!updated) throw new Error('Playthrough not found');
  return updated;
}

export async function getChronicle(
  playthroughId: string,
  forceRegenerate = false
) {
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) throw new Error('Playthrough not found');

  // Check if chronicle needs regeneration (new arcs added since last cache)
  const arcCount = await Arc.countDocuments({ playthroughId });
  const cachedArcCount = playthrough.chronicleCache?.arcSummaries?.length ?? 0;

  if (forceRegenerate || arcCount > cachedArcCount || !playthrough.chronicleCache) {
    await generateChronicleCache(playthroughId);
    const refreshed = await Playthrough.findById(playthroughId).lean();
    if (!refreshed) throw new Error('Playthrough not found after regeneration');
    return {
      playthroughName: refreshed.name,
      worldId: refreshed.worldId,
      status: refreshed.status,
      chronicle: refreshed.chronicleCache,
      completedAt: refreshed.completedAt ?? null,
    };
  }

  return {
    playthroughName: playthrough.name,
    worldId: playthrough.worldId,
    status: playthrough.status,
    chronicle: playthrough.chronicleCache,
    completedAt: playthrough.completedAt ?? null,
  };
}

export async function generateShareId(playthroughId: string): Promise<string> {
  const shareId = crypto.randomUUID();
  await Playthrough.findByIdAndUpdate(playthroughId, {
    $set: { shareId },
  });
  return shareId;
}

export async function getChronicleStats(playthroughId: string) {
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) throw new Error('Playthrough not found');

  const stats = playthrough.chronicleCache?.stats;
  if (!stats) {
    // Generate on demand
    await generateChronicleCache(playthroughId);
    const refreshed = await Playthrough.findById(playthroughId).lean();
    if (!refreshed) throw new Error('Playthrough not found');
    const newStats = refreshed.chronicleCache?.stats;
    return {
      ...newStats,
      completionPercent: refreshed.status === 'completed' ? 100 : undefined,
    };
  }

  return {
    ...stats,
    completionPercent: playthrough.status === 'completed' ? 100 : undefined,
  };
}
