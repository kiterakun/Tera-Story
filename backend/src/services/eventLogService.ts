import { EventLog, EventLogSeverity, EventLogType } from '../models/EventLog';

export interface LogEventParams {
  playthroughId: string;
  chapterId?: string;
  userId: string;
  type: EventLogType;
  severity?: EventLogSeverity;
  source: string;
  title: string;
  description?: string;
  details?: Record<string, unknown>;
  language?: string;
}

export interface ListEventsOptions {
  page?: number;
  limit?: number;
  severity?: EventLogSeverity;
  type?: EventLogType;
}

/**
 * Fire-and-forget event logger. Never throws back to callers.
 */
export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    await EventLog.create({
      playthroughId: params.playthroughId,
      chapterId: params.chapterId,
      userId: params.userId,
      type: params.type,
      severity: params.severity ?? 'info',
      source: params.source,
      title: params.title,
      description: params.description ?? '',
      details: params.details,
      language: params.language ?? 'en',
    });
  } catch (err) {
    // Logging must never break the main flow
    console.error('[EventLog] Failed to persist event:', err);
  }
}

export async function listEvents(
  playthroughId: string,
  options: ListEventsOptions = {}
): Promise<{ events: import('../models/EventLog').IEventLogDocument[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, Math.min(100, options.limit ?? 50));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { playthroughId };
  if (options.severity) query.severity = options.severity;
  if (options.type) query.type = options.type;

  const [events, total] = await Promise.all([
    EventLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    EventLog.countDocuments(query),
  ]);

  return { events, total, page, limit };
}

export async function deleteEvent(eventId: string, userId: string): Promise<boolean> {
  const event = await EventLog.findOne({ _id: eventId, userId });
  if (!event) return false;
  event.deletedAt = new Date();
  await event.save();
  return true;
}

export async function deleteAllEvents(playthroughId: string, userId: string): Promise<number> {
  const result = await EventLog.updateMany(
    { playthroughId, userId, deletedAt: null },
    { deletedAt: new Date() }
  );
  return result.modifiedCount ?? 0;
}

export async function markEventsSeen(playthroughId: string, userId: string): Promise<void> {
  await EventLog.updateMany({ playthroughId, userId, seen: false }, { seen: true });
}
