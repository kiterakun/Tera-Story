import mongoose from 'mongoose';
import { DailyLogin } from '../models/DailyLogin';
import { Friendship } from '../models/Friendship';
import { StoryCard } from '../models/StoryCard';
import { User } from '../models/User';

export type LeaderboardType = 'scenes' | 'achievements' | 'streak' | 'cards';
export type LeaderboardScope = 'friends' | 'global';
export type LeaderboardPeriod = 'weekly' | 'alltime';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  level: number;
  value: number;
}

interface RankedValue {
  userId: string;
  value: number;
}

function weekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return start;
}

async function scopedUserIds(scope: LeaderboardScope, userId: string): Promise<string[] | null> {
  if (scope === 'global') return null;

  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ userId }, { friendId: userId }],
  })
    .select('userId friendId')
    .lean();

  const ids = new Set<string>([userId]);
  for (const friendship of friendships) {
    ids.add(friendship.userId.toString());
    ids.add(friendship.friendId.toString());
  }

  return Array.from(ids);
}

async function rankedFromUserField(
  field: 'totalScenesCompleted' | 'totalAchievementsUnlocked',
  scope: LeaderboardScope,
  ids: string[] | null,
  period: LeaderboardPeriod
): Promise<RankedValue[]> {
  if (period === 'weekly') return [];

  const filter: Record<string, unknown> = scope === 'global'
    ? { 'privacySettings.showOnLeaderboard': true }
    : { _id: { $in: ids ?? [] } };

  const users = await User.find(filter)
    .select(field)
    .sort({ [field]: -1 })
    .limit(100)
    .lean();

  return users.map((user) => ({
    userId: user._id.toString(),
    value: typeof user[field] === 'number' ? user[field] : 0,
  }));
}

async function rankedFromStreak(
  scope: LeaderboardScope,
  ids: string[] | null,
  period: LeaderboardPeriod
): Promise<RankedValue[]> {
  const match: Record<string, unknown> = {};
  if (scope === 'friends') match.userId = { $in: (ids ?? []).map((id) => new mongoose.Types.ObjectId(id)) };
  if (period === 'weekly') match.claimedAt = { $gte: weekStart() };

  const rows = await DailyLogin.aggregate<{ _id: mongoose.Types.ObjectId; value: number }>([
    { $match: match },
    { $group: { _id: '$userId', value: { $max: '$streak' } } },
    { $sort: { value: -1 } },
    { $limit: 100 },
  ]);

  return rows.map((row) => ({ userId: row._id.toString(), value: row.value }));
}

async function rankedFromCards(
  scope: LeaderboardScope,
  ids: string[] | null,
  period: LeaderboardPeriod
): Promise<RankedValue[]> {
  const match: Record<string, unknown> = {};
  if (scope === 'friends') match.userId = { $in: (ids ?? []).map((id) => new mongoose.Types.ObjectId(id)) };
  if (period === 'weekly') match.unlockedAt = { $gte: weekStart() };

  const rows = await StoryCard.aggregate<{ _id: mongoose.Types.ObjectId; value: number }>([
    { $match: match },
    { $group: { _id: '$userId', value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: 100 },
  ]);

  return rows.map((row) => ({ userId: row._id.toString(), value: row.value }));
}

async function loadRankedValues(
  type: LeaderboardType,
  scope: LeaderboardScope,
  period: LeaderboardPeriod,
  ids: string[] | null
): Promise<RankedValue[]> {
  if (type === 'scenes') return rankedFromUserField('totalScenesCompleted', scope, ids, period);
  if (type === 'achievements') return rankedFromUserField('totalAchievementsUnlocked', scope, ids, period);
  if (type === 'streak') return rankedFromStreak(scope, ids, period);
  return rankedFromCards(scope, ids, period);
}

export async function getLeaderboard(
  type: LeaderboardType,
  scope: LeaderboardScope,
  period: LeaderboardPeriod,
  userId: string
): Promise<{ entries: LeaderboardEntry[]; myRank: number }> {
  const ids = await scopedUserIds(scope, userId);
  const ranked = await loadRankedValues(type, scope, period, ids);

  const userIds = ranked.map((entry) => entry.userId);
  if (userIds.length === 0) return { entries: [], myRank: 0 };

  const users = await User.find({
    _id: { $in: userIds },
    ...(scope === 'global' ? { 'privacySettings.showOnLeaderboard': true } : {}),
  })
    .select('username displayName avatar privacySettings level')
    .lean();

  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  const entries: LeaderboardEntry[] = [];

  ranked.forEach((entry, index) => {
    const user = usersById.get(entry.userId);
    if (!user) return;
    entries.push({
      rank: index + 1,
      userId: entry.userId,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      level: user.level ?? 1,
      value: entry.value,
    });
  });

  const myEntry = entries.find((entry) => entry.userId === userId);
  const myRank = myEntry?.rank ?? 0;

  if (myRank === 0) return { entries: entries.slice(0, 100), myRank };

  const start = Math.max(0, myRank - 6);
  const end = Math.min(entries.length, myRank + 5);
  return { entries: entries.slice(start, end), myRank };
}
