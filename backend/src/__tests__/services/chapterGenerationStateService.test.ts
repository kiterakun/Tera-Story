import { describe, it, expect, afterEach } from 'vitest';
import mongoose from 'mongoose';
import {
  createGenerationState,
  getLatestGenerationState,
  startPhase,
  completePhase,
  failPhase,
  completeGenerationState,
  getNextPhase,
  isPhaseCompleted,
  getPhaseAttempts,
} from '../../services/chapterGenerationStateService';
import { ChapterGenerationState } from '../../models/ChapterGenerationState';

describe('chapterGenerationStateService', () => {
  afterEach(async () => {
    await ChapterGenerationState.deleteMany({});
  });

  const modelSnapshot = {
    contextAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    writerAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    supportAgent: { provider: 'openai' as const, model: 'gpt-4o' },
    imageAgent: { provider: 'openai' as const, model: 'dall-e-3' },
  };

  it('creates a generation state with all phases pending', async () => {
    const playthroughId = new mongoose.Types.ObjectId().toString();
    const chapterId = new mongoose.Types.ObjectId().toString();
    const arcId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    const state = await createGenerationState({
      playthroughId,
      chapterId,
      arcId,
      userId,
      playerChoice: 'Continue',
      modelSnapshot,
    });

    expect(state.playthroughId.toString()).toBe(playthroughId);
    expect(state.chapterId.toString()).toBe(chapterId);
    expect(state.status).toBe('running');
    expect(state.currentPhase).toBe('context');
    expect(state.phases).toHaveLength(6);
    expect(state.phases.map((p) => p.phase)).toEqual([
      'context',
      'writing',
      'tools',
      'post_effects',
      'travel',
      'complete',
    ]);
    expect(state.phases.every((p) => p.status === 'pending')).toBe(true);
  });

  it('tracks phase start and completion', async () => {
    const state = await createGenerationState({
      playthroughId: new mongoose.Types.ObjectId().toString(),
      chapterId: new mongoose.Types.ObjectId().toString(),
      arcId: new mongoose.Types.ObjectId().toString(),
      userId: new mongoose.Types.ObjectId().toString(),
      playerChoice: 'Continue',
      modelSnapshot,
    });

    await startPhase(state._id.toString(), 'context');
    let updated = await getLatestGenerationState(state.playthroughId.toString());
    expect(updated?.currentPhase).toBe('context');
    expect(getPhaseAttempts(updated!, 'context')).toBe(1);
    expect(updated?.phases.find((p) => p.phase === 'context')?.status).toBe('running');

    await completePhase(state._id.toString(), 'context', { tokens: 100 });
    updated = await getLatestGenerationState(state.playthroughId.toString());
    expect(isPhaseCompleted(updated!, 'context')).toBe(true);
    expect(updated?.phases.find((p) => p.phase === 'context')?.outputs).toEqual({ tokens: 100 });
    expect(getNextPhase('context')).toBe('writing');
  });

  it('marks state as awaiting_user on phase failure', async () => {
    const state = await createGenerationState({
      playthroughId: new mongoose.Types.ObjectId().toString(),
      chapterId: new mongoose.Types.ObjectId().toString(),
      arcId: new mongoose.Types.ObjectId().toString(),
      userId: new mongoose.Types.ObjectId().toString(),
      playerChoice: 'Continue',
      modelSnapshot,
    });

    await startPhase(state._id.toString(), 'writing');
    await failPhase(state._id.toString(), 'writing', {
      message: 'Model timeout',
      code: 'ETIMEDOUT',
      provider: 'openai',
      model: 'gpt-4o',
    });

    const updated = await getLatestGenerationState(state.playthroughId.toString());
    expect(updated?.status).toBe('awaiting_user');
    expect(updated?.error?.message).toBe('Model timeout');
    expect(updated?.error?.failedPhase).toBe('writing');
    expect(updated?.phases.find((p) => p.phase === 'writing')?.status).toBe('failed');
  });

  it('completes the whole generation state', async () => {
    const state = await createGenerationState({
      playthroughId: new mongoose.Types.ObjectId().toString(),
      chapterId: new mongoose.Types.ObjectId().toString(),
      arcId: new mongoose.Types.ObjectId().toString(),
      userId: new mongoose.Types.ObjectId().toString(),
      playerChoice: 'Continue',
      modelSnapshot,
    });

    await completeGenerationState(state._id.toString());
    const updated = await getLatestGenerationState(state.playthroughId.toString());
    expect(updated?.status).toBe('completed');
    expect(updated?.currentPhase).toBe('complete');
    expect(updated?.completedAt).toBeDefined();
  });
});
