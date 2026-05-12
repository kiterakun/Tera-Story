import { DailyLogin } from '../models/DailyLogin';
import { DailyQuest } from '../models/DailyQuest';
import { StreakFreeze } from '../models/StreakFreeze';

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastResetDate: string | null = null;

function getUTCDateString(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

function getWeekStartDateString(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0]!;
}

async function runDailyReset(): Promise<void> {
  try {
    const today = getUTCDateString(new Date());

    // Only run once per UTC day
    if (lastResetDate === today) return;
    lastResetDate = today;

    console.log(`[DailyReset] Running daily reset for ${today}`);

    // Reset streak freeze tokens on Monday
    const todayDay = new Date(today + 'T00:00:00Z').getUTCDay();
    if (todayDay === 1) {
      const weekStart = getWeekStartDateString(today);
      await StreakFreeze.updateMany(
        { weekStart: { $lt: weekStart } },
        { weekStart, available: 1, usedDates: [] }
      );
      console.log(`[DailyReset] Reset streak freeze tokens for week ${weekStart}`);
    }

    // Clean up daily data older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    const cutoffDate = getUTCDateString(thirtyDaysAgo);

    const loginCleanup = await DailyLogin.deleteMany({ date: { $lt: cutoffDate } });
    const questCleanup = await DailyQuest.deleteMany({ date: { $lt: cutoffDate } });

    if (loginCleanup.deletedCount > 0 || questCleanup.deletedCount > 0) {
      console.log(
        `[DailyReset] Cleaned up old data: ${loginCleanup.deletedCount} logins, ${questCleanup.deletedCount} quests before ${cutoffDate}`
      );
    }

    console.log('[DailyReset] Daily reset complete');
  } catch (err) {
    console.error('[DailyReset] Error during daily reset:', err);
  }
}

export function startDailyResetJob(): void {
  if (intervalId) return;

  console.log('[DailyReset] Starting daily reset job (checking every 60s)');
  intervalId = setInterval(runDailyReset, 60_000);

  // Run immediately on start
  runDailyReset();
}

export function stopDailyResetJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[DailyReset] Stopped daily reset job');
  }
}