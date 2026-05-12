import { DailyLogin } from '../models/DailyLogin';
import { DailyQuest } from '../models/DailyQuest';
import type { IDailyQuestDocument, QuestType } from '../models/DailyQuest';
import { StreakFreeze } from '../models/StreakFreeze';
import { addXp } from './progressionService';
import type { AddXpResult } from './progressionService';

// --- Date Helpers ---

function getUTCDateString(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().split('T')[0]!;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0]!;
}

function getDayBeforeYesterdayDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 2);
  return d.toISOString().split('T')[0]!;
}

function getWeekStartDateString(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday offset
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0]!;
}

function getNextMidnightISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// --- Daily Reward Table ---

interface DailyRewardConfig {
  xp: number;
  bonus?: string;
}

const DAILY_REWARDS: Record<number, DailyRewardConfig> = {
  1: { xp: 25 },
  2: { xp: 30 },
  3: { xp: 35, bonus: 'rare_card_chance' },
  4: { xp: 40 },
  5: { xp: 50, bonus: 'title_devoted' },
  6: { xp: 60 },
  7: { xp: 100, bonus: 'badge_week_warrior' },
};

// --- Streak Milestones ---

interface StreakMilestone {
  xpBonus: number;
  badge?: string;
  title?: string;
}

const STREAK_MILESTONES: Record<number, StreakMilestone> = {
  7: { xpBonus: 50 },
  14: { xpBonus: 75 },
  30: { xpBonus: 150, badge: 'badge_loyal' },
  90: { xpBonus: 300, title: 'title_loyal' },
  365: { xpBonus: 1000, badge: 'legendary' },
};

// --- Quest Pool ---

interface QuestTemplate {
  type: QuestType;
  targetMin: number;
  targetMax: number;
  xpMin: number;
  xpMax: number;
}

const QUEST_POOL: QuestTemplate[] = [
  { type: 'read_scenes', targetMin: 3, targetMax: 5, xpMin: 30, xpMax: 50 },
  { type: 'make_choices', targetMin: 3, targetMax: 5, xpMin: 25, xpMax: 40 },
  { type: 'win_combat', targetMin: 1, targetMax: 2, xpMin: 40, xpMax: 60 },
  { type: 'unlock_achievement', targetMin: 1, targetMax: 1, xpMin: 50, xpMax: 50 },
  { type: 'collect_card', targetMin: 1, targetMax: 1, xpMin: 30, xpMax: 30 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

// --- Exported Types ---

export interface DailyStatus {
  todayClaimed: boolean;
  currentStreak: number;
  longestStreak: number;
  weekProgress: boolean[];
  streakFreezesAvailable: number;
  dailyQuests: Array<{
    _id: string;
    questType: QuestType;
    target: number;
    progress: number;
    completed: boolean;
    claimed: boolean;
    xpReward: number;
  }>;
  nextResetTime: string;
}

export interface ClaimDailyResult {
  streak: number;
  xpEarned: number;
  totalXpEarned: number;
  bonus?: string;
  milestoneBonus?: number;
  milestoneBadge?: string;
  milestoneTitle?: string;
  dayNumber: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface ClaimQuestResult {
  questId: string;
  xpEarned: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface UpdateQuestProgressResult {
  updated: Array<{
    _id: string;
    questType: QuestType;
    target: number;
    progress: number;
    completed: boolean;
    claimed: boolean;
  }>;
}

export interface UseStreakFreezeResult {
  used: boolean;
  streakContinued: boolean;
  newStreak?: number;
}

// --- getDailyStatus ---

export async function getDailyStatus(
  userId: string
): Promise<DailyStatus> {
  const today = getUTCDateString();
  const weekStart = getWeekStartDateString(today);

  const [todayLogin, lastLogin, longestAgg, weekLogins, freeze, quests] =
    await Promise.all([
      DailyLogin.findOne({ userId, date: today }).lean(),
      DailyLogin.findOne({ userId }).sort({ date: -1 }).lean(),
      DailyLogin.aggregate([
        { $match: { userId } },
        { $group: { _id: null, maxStreak: { $max: '$streak' } } },
      ]),
      DailyLogin.find({
        userId,
        date: { $gte: weekStart, $lte: today },
      }).lean(),
      StreakFreeze.findOne({ userId, weekStart }).lean(),
      DailyQuest.find({ userId, date: today }).lean(),
    ]);

  const todayClaimed = !!todayLogin;
  const currentStreak = lastLogin?.streak ?? 0;
  const longestStreak =
    longestAgg.length > 0 ? (longestAgg[0]?.maxStreak ?? 0) : 0;

  // Week progress: Monday-Sunday boolean array
  const weekDates = new Set(weekLogins.map((l) => l.date));
  const weekProgress: boolean[] = [];
  const weekBase = new Date(weekStart + 'T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekBase);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0]!;
    weekProgress.push(weekDates.has(dateStr));
  }

  const streakFreezesAvailable = freeze?.available ?? 0;

  const dailyQuests = quests.map((q) => ({
    _id: q._id.toString(),
    questType: q.questType,
    target: q.target,
    progress: q.progress,
    completed: q.completed,
    claimed: q.claimed,
    xpReward: q.xpReward,
  }));

  const nextResetTime = getNextMidnightISO();

  return {
    todayClaimed,
    currentStreak,
    longestStreak,
    weekProgress,
    streakFreezesAvailable,
    dailyQuests,
    nextResetTime,
  };
}

// --- claimDaily ---

export async function claimDaily(
  userId: string
): Promise<ClaimDailyResult> {
  const today = getUTCDateString();
  const yesterday = getYesterdayDateString();
  const dayBeforeYesterday = getDayBeforeYesterdayDateString();

  // Check already claimed today
  const existing = await DailyLogin.findOne({ userId, date: today }).lean();
  if (existing) {
    throw new AlreadyClaimedError();
  }

  const lastLogin = await DailyLogin.findOne({ userId })
    .sort({ date: -1 })
    .lean();

  let streak: number;

  if (!lastLogin) {
    // First ever login
    streak = 1;
  } else if (lastLogin.date === yesterday) {
    // Consecutive day
    streak = lastLogin.streak + 1;
  } else if (lastLogin.date === dayBeforeYesterday) {
    // Missed exactly one day — try streak freeze
    const weekStart = getWeekStartDateString(today);
    const freeze = await StreakFreeze.findOneAndUpdate(
      { userId, weekStart, available: { $gt: 0 } },
      {
        $set: { available: 0 },
        $push: { usedDates: yesterday },
      },
      { returnDocument: 'after' }
    );

    if (freeze) {
      streak = lastLogin.streak + 1;
    } else {
      streak = 1;
    }
  } else {
    // Missed multiple days — reset
    streak = 1;
  }

  // Day number cycles 1-7
  const dayNumber = ((streak - 1) % 7) + 1;
  const reward = DAILY_REWARDS[dayNumber]!;

  // Check streak milestone
  let milestoneBonus = 0;
  let milestoneBadge: string | undefined;
  let milestoneTitle: string | undefined;

  const milestone = STREAK_MILESTONES[streak];
  if (milestone) {
    milestoneBonus = milestone.xpBonus;
    milestoneBadge = milestone.badge;
    milestoneTitle = milestone.title;
  }

  // Create DailyLogin record
  await DailyLogin.create({
    userId,
    date: today,
    streak,
    reward: {
      xp: reward.xp,
      bonus: reward.bonus,
      bonusClaimed: false,
    },
  });

  // Award base XP
  const baseXpResult = await addXp(userId, reward.xp, 'daily_login');

  // Award milestone bonus XP if applicable
  let milestoneXpResult: AddXpResult | null = null;
  if (milestoneBonus > 0) {
    milestoneXpResult = await addXp(userId, milestoneBonus, 'daily_login');
  }

  const totalXpEarned = reward.xp + (milestoneBonus ?? 0);
  const leveledUp = baseXpResult.leveledUp || (milestoneXpResult?.leveledUp ?? false);
  const finalLevel = milestoneXpResult?.newLevel ?? baseXpResult.newLevel;

  return {
    streak,
    xpEarned: reward.xp,
    totalXpEarned,
    bonus: reward.bonus,
    milestoneBonus: milestoneBonus > 0 ? milestoneBonus : undefined,
    milestoneBadge,
    milestoneTitle,
    dayNumber,
    leveledUp,
    newLevel: leveledUp ? finalLevel : undefined,
  };
}

// --- generateDailyQuests ---

export async function generateDailyQuests(
  userId: string
): Promise<IDailyQuestDocument[]> {
  const today = getUTCDateString();

  // Check if quests already exist for today
  const existing = await DailyQuest.find({ userId, date: today }).lean();
  if (existing.length > 0) {
    return existing as IDailyQuestDocument[];
  }

  // Select 3–4 random types from the pool, no duplicates
  const count = randomInt(3, 4);
  const shuffled = shuffleArray(QUEST_POOL);
  const selected = shuffled.slice(0, count);

  const docs = selected.map((template) => ({
    userId,
    date: today,
    questType: template.type,
    target: randomInt(template.targetMin, template.targetMax),
    progress: 0,
    completed: false,
    claimed: false,
    xpReward: randomInt(template.xpMin, template.xpMax),
  }));

  const created = await DailyQuest.insertMany(docs);
  return created as unknown as IDailyQuestDocument[];
}

// --- claimQuest ---

export async function claimQuest(
  userId: string,
  questId: string
): Promise<ClaimQuestResult> {
  const quest = await DailyQuest.findById(questId);

  if (!quest) {
    throw new QuestNotFoundError();
  }

  if (quest.userId.toString() !== userId) {
    throw new QuestNotOwnedError();
  }

  if (!quest.completed) {
    throw new QuestNotCompletedError();
  }

  if (quest.claimed) {
    throw new QuestAlreadyClaimedError();
  }

  quest.claimed = true;
  await quest.save();

  const xpResult = await addXp(userId, quest.xpReward, 'daily_login');

  return {
    questId: quest._id.toString(),
    xpEarned: quest.xpReward,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
  };
}

// --- updateQuestProgress ---

export async function updateQuestProgress(
  userId: string,
  questType: string,
  increment: number
): Promise<UpdateQuestProgressResult> {
  const today = getUTCDateString();

  // Find active (not completed) quests of this type for today
  const quests = await DailyQuest.find({
    userId,
    date: today,
    questType: questType as QuestType,
    completed: false,
  });

  const updated: UpdateQuestProgressResult['updated'] = [];

  for (const quest of quests) {
    quest.progress = Math.min(quest.progress + increment, quest.target);

    if (quest.progress >= quest.target) {
      quest.completed = true;
    }

    await quest.save();

    updated.push({
      _id: quest._id.toString(),
      questType: quest.questType,
      target: quest.target,
      progress: quest.progress,
      completed: quest.completed,
      claimed: quest.claimed,
    });
  }

  return { updated };
}

// --- useStreakFreeze ---

export async function useStreakFreeze(
  userId: string
): Promise<UseStreakFreezeResult> {
  const today = getUTCDateString();
  const yesterday = getYesterdayDateString();

  // Check if user actually missed yesterday
  const yesterdayLogin = await DailyLogin.findOne({
    userId,
    date: yesterday,
  }).lean();

  if (yesterdayLogin) {
    // Didn't miss yesterday — no freeze needed
    return { used: false, streakContinued: true };
  }

  // Check if there's a login from day before yesterday (only 1 day missed)
  const dayBeforeYesterday = getDayBeforeYesterdayDateString();
  const dayBeforeLogin = await DailyLogin.findOne({
    userId,
    date: dayBeforeYesterday,
  }).lean();

  if (!dayBeforeLogin) {
    // Missed more than 1 day — freeze can't help
    return { used: false, streakContinued: false };
  }

  const weekStart = getWeekStartDateString(today);
  const freeze = await StreakFreeze.findOneAndUpdate(
    { userId, weekStart, available: { $gt: 0 } },
    {
      $set: { available: 0 },
      $push: { usedDates: yesterday },
    },
    { returnDocument: 'after' }
  );

  if (!freeze) {
    return { used: false, streakContinued: false };
  }

  return {
    used: true,
    streakContinued: true,
    newStreak: dayBeforeLogin.streak + 1,
  };
}

// --- Custom Error Classes ---

export class AlreadyClaimedError extends Error {
  constructor() {
    super('Daily reward already claimed for today');
    this.name = 'AlreadyClaimedError';
  }
}

export class QuestNotFoundError extends Error {
  constructor() {
    super('Quest not found');
    this.name = 'QuestNotFoundError';
  }
}

export class QuestNotOwnedError extends Error {
  constructor() {
    super('Quest does not belong to this user');
    this.name = 'QuestNotOwnedError';
  }
}

export class QuestNotCompletedError extends Error {
  constructor() {
    super('Quest is not yet completed');
    this.name = 'QuestNotCompletedError';
  }
}

export class QuestAlreadyClaimedError extends Error {
  constructor() {
    super('Quest reward already claimed');
    this.name = 'QuestAlreadyClaimedError';
  }
}
