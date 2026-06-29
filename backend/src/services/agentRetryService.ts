import { setTimeout } from 'timers/promises';
import type { GenerationPhase } from '../models/ChapterGenerationState';
import * as stateService from './chapterGenerationStateService';
import { logEvent } from './eventLogService';

export interface RetryOptions {
  stateId: string;
  phase: GenerationPhase;
  playthroughId: string;
  chapterId?: string;
  userId: string;
  language?: string;
  maxAttempts?: number;
  baseDelayMs?: number;
  provider?: string;
  model?: string;
}

function isRetryableError(): boolean {
  // Retry all AI/provider errors by default; caller can still surface permanent errors after exhaustion.
  // In the future we can classify auth/bad-request as non-retryable, but the requirement says retry 3 times.
  return true;
}

function extractErrorDetails(err: unknown): {
  message: string;
  code?: string;
  stack?: string;
} {
  if (err instanceof Error) {
    return {
      message: err.message,
      code: (err as { code?: string }).code,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

/**
 * Execute an operation with automatic retry.
 * Attempt 1 + up to 3 retries (maxAttempts=4 by default).
 * Each attempt updates the generation state and logs to EventLog.
 */
export async function withAgentRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const language = options.language ?? 'en';

  let lastError: { message: string; code?: string; stack?: string } | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await stateService.startPhase(options.stateId, options.phase);

    await logEvent({
      playthroughId: options.playthroughId,
      chapterId: options.chapterId,
      userId: options.userId,
      type: 'phase_started',
      severity: 'info',
      source: 'agentRetryService',
      title: `Phase ${options.phase} attempt ${attempt}/${maxAttempts}`,
      description: `Starting ${options.phase} phase (attempt ${attempt} of ${maxAttempts})`,
      details: { phase: options.phase, attempt, maxAttempts, stateId: options.stateId },
      language,
    });

    try {
      const result = await operation(attempt);

      await stateService.completePhase(options.stateId, options.phase);
      await logEvent({
        playthroughId: options.playthroughId,
        chapterId: options.chapterId,
        userId: options.userId,
        type: 'phase_completed',
        severity: 'success',
        source: 'agentRetryService',
        title: `Phase ${options.phase} completed`,
        description: `${options.phase} completed on attempt ${attempt}`,
        details: { phase: options.phase, attempt, stateId: options.stateId },
        language,
      });

      return result;
    } catch (err) {
      lastError = extractErrorDetails(err);
      const isLastAttempt = attempt === maxAttempts;

      await logEvent({
        playthroughId: options.playthroughId,
        chapterId: options.chapterId,
        userId: options.userId,
        type: 'phase_failed',
        severity: isLastAttempt ? 'error' : 'warning',
        source: 'agentRetryService',
        title: `Phase ${options.phase} failed (attempt ${attempt}/${maxAttempts})`,
        description: lastError.message,
        details: {
          phase: options.phase,
          attempt,
          maxAttempts,
          code: lastError.code,
          provider: options.provider,
          model: options.model,
          stateId: options.stateId,
        },
        language,
      });

      if (isLastAttempt || !isRetryableError()) {
        await stateService.failPhase(options.stateId, options.phase, {
          message: lastError.message,
          code: lastError.code,
          stack: lastError.stack,
          provider: options.provider,
          model: options.model,
        });
        throw err;
      }

      const delay = baseDelayMs * 2 ** (attempt - 1);
      await setTimeout(delay);
    }
  }

  // Should never reach here; throw last error defensively.
  throw new Error(lastError?.message ?? `Operation failed after ${maxAttempts} attempts`);
}
