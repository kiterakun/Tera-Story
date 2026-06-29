import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { withAgentRetry } from '../../services/agentRetryService';
import { ChapterGenerationState } from '../../models/ChapterGenerationState';
import { EventLog } from '../../models/EventLog';

describe('agentRetryService', () => {
  beforeEach(async () => {
    await ChapterGenerationState.deleteMany({});
    await EventLog.deleteMany({});
  });

  afterEach(async () => {
    await ChapterGenerationState.deleteMany({});
    await EventLog.deleteMany({});
  });

  const modelSnapshot = {
    contextAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    writerAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    supportAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    imageAgent: { provider: 'openai' as const, model: 'dall-e-3' },
  };

  async function createState() {
    return ChapterGenerationState.create({
      playthroughId: new mongoose.Types.ObjectId(),
      chapterId: new mongoose.Types.ObjectId(),
      arcId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      playerChoice: 'Continue',
      status: 'running',
      currentPhase: 'context',
      phases: [
        { phase: 'context', status: 'pending', attempts: 0, maxAttempts: 4 },
        { phase: 'writing', status: 'pending', attempts: 0, maxAttempts: 4 },
      ],
      autoRetryCount: 0,
      userRetryCount: 0,
      modelSnapshot,
    });
  }

  it('succeeds on first attempt and completes phase', async () => {
    const state = await createState();
    const operation = vi.fn().mockResolvedValue('ok');

    const result = await withAgentRetry(operation, {
      stateId: state._id.toString(),
      phase: 'context',
      playthroughId: state.playthroughId.toString(),
      chapterId: state.chapterId.toString(),
      userId: state.userId.toString(),
      maxAttempts: 4,
      baseDelayMs: 10,
    });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);

    const updated = await ChapterGenerationState.findById(state._id).lean();
    expect(updated?.phases.find((p) => p.phase === 'context')?.status).toBe('completed');
  });

  it('retries up to 3 times and succeeds on the 4th attempt', async () => {
    const state = await createState();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValueOnce(new Error('fail 3'))
      .mockResolvedValueOnce('ok');

    const result = await withAgentRetry(operation, {
      stateId: state._id.toString(),
      phase: 'context',
      playthroughId: state.playthroughId.toString(),
      chapterId: state.chapterId.toString(),
      userId: state.userId.toString(),
      maxAttempts: 4,
      baseDelayMs: 10,
    });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(4);

    const updated = await ChapterGenerationState.findById(state._id).lean();
    expect(updated?.phases.find((p) => p.phase === 'context')?.status).toBe('completed');
    expect(updated?.phases.find((p) => p.phase === 'context')?.attempts).toBe(4);
  });

  it('marks state as awaiting_user after exhausting retries', async () => {
    const state = await createState();
    const operation = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      withAgentRetry(operation, {
        stateId: state._id.toString(),
        phase: 'context',
        playthroughId: state.playthroughId.toString(),
        chapterId: state.chapterId.toString(),
        userId: state.userId.toString(),
        maxAttempts: 4,
        baseDelayMs: 10,
      })
    ).rejects.toThrow('always fails');

    expect(operation).toHaveBeenCalledTimes(4);

    const updated = await ChapterGenerationState.findById(state._id).lean();
    expect(updated?.status).toBe('awaiting_user');
    expect(updated?.error?.message).toBe('always fails');
    expect(updated?.error?.failedPhase).toBe('context');
  });

  it('logs phase failures to EventLog', async () => {
    const state = await createState();
    const operation = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(
      withAgentRetry(operation, {
        stateId: state._id.toString(),
        phase: 'writing',
        playthroughId: state.playthroughId.toString(),
        chapterId: state.chapterId.toString(),
        userId: state.userId.toString(),
        maxAttempts: 2,
        baseDelayMs: 10,
      })
    ).rejects.toThrow('boom');

    const logs = await EventLog.find({ playthroughId: state.playthroughId });
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.some((l) => l.type === 'phase_failed')).toBe(true);
  });
});
