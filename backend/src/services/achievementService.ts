import { Achievement } from '../models/Achievement';
import type { IAchievementDocument } from '../models/Achievement';
import { UserAchievement } from '../models/UserAchievement';
import { User } from '../models/User';
import { ACHIEVEMENT_SEEDS } from '../seed/achievements';
import { emitToUser } from './sseManager';

interface AchievementEvent {
  type: 'scene_completed' | 'choice_made' | 'combat_won' | 'card_unlocked' | 'playthrough_completed' | 'enemy_spared' | 'secret_discovered';
  data?: Record<string, unknown>;
}

interface CheckAchievementsResult {
  unlocked: IAchievementDocument[];
  progressUpdated: string[];
}

function getFieldValue(user: unknown, field: string): number {
  if (user && typeof user === 'object' && field in user) {
    const val = (user as Record<string, unknown>)[field];
    return typeof val === 'number' ? val : 0;
  }
  return 0;
}

export async function initializeUserAchievements(userId: string): Promise<void> {
  const existing = await UserAchievement.findOne({ userId }).lean();
  if (existing) return;

  const docs = ACHIEVEMENT_SEEDS.map((seed) => ({
    userId,
    achievementKey: seed.key,
    progress: 0,
    unlockedAt: null,
  }));

  await UserAchievement.insertMany(docs);
}

export async function checkAchievements(
  userId: string,
  event: AchievementEvent
): Promise<CheckAchievementsResult> {
  await initializeUserAchievements(userId);

  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  const userAchievements = await UserAchievement.find({
    userId,
    unlockedAt: null,
  }).lean();

  if (userAchievements.length === 0) {
    return { unlocked: [], progressUpdated: [] };
  }

  const keys = userAchievements.map((ua) => ua.achievementKey);
  const achievements = await Achievement.find({ key: { $in: keys } }).lean();

  const unlocked: IAchievementDocument[] = [];
  const progressUpdated: string[] = [];

  for (const ach of achievements) {
    const ua = userAchievements.find((u) => u.achievementKey === ach.key);
    if (!ua) continue;

    const criteria = ach.unlockCriteria;

    // Level-based check
    if (criteria.field === 'level') {
      const userLevel = getFieldValue(user, 'level');
      if (userLevel >= (criteria.threshold ?? 1)) {
        await unlockAchievement(userId, ach, ua);
        unlocked.push(ach as unknown as IAchievementDocument);
        emitToUser(userId, 'achievement_unlock', {
          achievementKey: ach.key,
          achievementName: ach.name,
          xpReward: ach.xpReward,
        });
        continue;
      }
    }

    // Count-based check
    if (criteria.type === 'count' && criteria.field) {
      const currentVal = getFieldValue(user, criteria.field);
      const threshold = criteria.threshold ?? 1;

      // Update progress
      if (currentVal !== ua.progress) {
        await UserAchievement.updateOne(
          { userId, achievementKey: ach.key },
          { $set: { progress: currentVal } }
        );
        progressUpdated.push(ach.key);
      }

      if (currentVal >= threshold) {
        await unlockAchievement(userId, ach, ua);
        unlocked.push(ach as unknown as IAchievementDocument);
        emitToUser(userId, 'achievement_unlock', {
          achievementKey: ach.key,
          achievementName: ach.name,
          xpReward: ach.xpReward,
        });
      }
      continue;
    }

    // Streak-based check
    if (criteria.type === 'streak' && criteria.field) {
      const currentVal = getFieldValue(user, criteria.field);
      const threshold = criteria.threshold ?? 1;

      if (currentVal !== ua.progress) {
        await UserAchievement.updateOne(
          { userId, achievementKey: ach.key },
          { $set: { progress: currentVal } }
        );
        progressUpdated.push(ach.key);
      }

      if (currentVal >= threshold) {
        await unlockAchievement(userId, ach, ua);
        unlocked.push(ach as unknown as IAchievementDocument);
        emitToUser(userId, 'achievement_unlock', {
          achievementKey: ach.key,
          achievementName: ach.name,
          xpReward: ach.xpReward,
        });
      }
      continue;
    }

    // Playthrough complete check
    if (criteria.type === 'playthrough_complete') {
      const count = getFieldValue(user, 'totalPlaythroughsCompleted');
      const threshold = criteria.threshold ?? 1;

      if (count !== ua.progress) {
        await UserAchievement.updateOne(
          { userId, achievementKey: ach.key },
          { $set: { progress: count } }
        );
        progressUpdated.push(ach.key);
      }

      if (count >= threshold) {
        await unlockAchievement(userId, ach, ua);
        unlocked.push(ach as unknown as IAchievementDocument);
        emitToUser(userId, 'achievement_unlock', {
          achievementKey: ach.key,
          achievementName: ach.name,
          xpReward: ach.xpReward,
        });
      }
      continue;
    }

    // Specific action check
    if (criteria.type === 'specific_action') {
      if (criteria.condition) {
        // Check if the event matches the condition
        const eventData = event.data ?? {};
        const eventCondition = eventData.condition as string | undefined;
        if (eventCondition === criteria.condition) {
          await unlockAchievement(userId, ach, ua);
          unlocked.push(ach as unknown as IAchievementDocument);
          emitToUser(userId, 'achievement_unlock', {
            achievementKey: ach.key,
            achievementName: ach.name,
            xpReward: ach.xpReward,
          });
        }
      }
    }
  }

  return { unlocked, progressUpdated };
}

async function unlockAchievement(
  userId: string,
  achievement: { key: string; xpReward: number },
  ua: { progress: number }
): Promise<void> {
  await UserAchievement.updateOne(
    { userId, achievementKey: achievement.key },
    {
      $set: {
        unlockedAt: new Date(),
        progress: ua.progress,
      },
    }
  );

  // Award XP — import dynamically to avoid circular dependency concern
  const { addXp } = await import('./progressionService');
  await addXp(userId, achievement.xpReward, 'achievement_unlock', {
    achievementKey: achievement.key,
  });
}

export async function getAchievements(
  userId: string,
  filters?: { category?: string; status?: string; rarity?: string }
) {
  await initializeUserAchievements(userId);

  const query: Record<string, unknown> = {};
  if (filters?.category) query.category = filters.category;
  if (filters?.rarity) query.rarity = filters.rarity;

  const achievements = await Achievement.find(query).sort({ sortOrder: 1 }).lean();
  const userAchievements = await UserAchievement.find({ userId }).lean();

  const result = achievements.map((ach) => {
    const ua = userAchievements.find((u) => u.achievementKey === ach.key);
    return {
      ...ach,
      unlocked: !!ua?.unlockedAt,
      unlockedAt: ua?.unlockedAt ?? null,
      progress: ua?.progress ?? 0,
    };
  });

  const totalUnlocked = result.filter((r) => r.unlocked).length;

  // Filter by status if provided
  let filtered = result;
  if (filters?.status === 'unlocked') {
    filtered = result.filter((r) => r.unlocked);
  } else if (filters?.status === 'locked') {
    filtered = result.filter((r) => !r.unlocked);
  } else if (filters?.status === 'in_progress') {
    filtered = result.filter((r) => !r.unlocked && r.progress > 0);
  }

  return {
    achievements: filtered,
    stats: {
      total: achievements.length,
      unlocked: totalUnlocked,
      percentComplete: Math.round((totalUnlocked / achievements.length) * 100),
    },
  };
}

export async function getRecentAchievements(userId: string, limit = 5) {
  const recent = await UserAchievement.find({
    userId,
    unlockedAt: { $ne: null },
  })
    .sort({ unlockedAt: -1 })
    .limit(limit)
    .lean();

  if (recent.length === 0) return [];

  const keys = recent.map((r) => r.achievementKey);
  const achievements = await Achievement.find({ key: { $in: keys } }).lean();

  return recent.map((ua) => {
    const ach = achievements.find((a) => a.key === ua.achievementKey);
    return { ...ua, achievement: ach ?? null };
  });
}
