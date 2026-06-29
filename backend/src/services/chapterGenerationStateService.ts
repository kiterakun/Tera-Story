import { ChapterGenerationState, GenerationPhase, IChapterGenerationStateDocument } from '../models/ChapterGenerationState';
import type { IContextOutput } from '../types/agent.types';
import type { IAISettings } from '../types/user.types';

const PHASE_ORDER: GenerationPhase[] = [
  'context',
  'writing',
  'tools',
  'post_effects',
  'travel',
  'complete',
];

export interface CreateGenerationStateParams {
  playthroughId: string;
  chapterId: string;
  arcId: string;
  userId: string;
  playerChoice: string;
  modelSnapshot: IAISettings;
}

export async function createGenerationState(
  params: CreateGenerationStateParams
): Promise<IChapterGenerationStateDocument> {
  return ChapterGenerationState.create({
    playthroughId: params.playthroughId,
    chapterId: params.chapterId,
    arcId: params.arcId,
    userId: params.userId,
    playerChoice: params.playerChoice,
    status: 'running',
    currentPhase: 'context',
    phases: PHASE_ORDER.map((phase) => ({
      phase,
      status: 'pending',
      attempts: 0,
      maxAttempts: phase === 'complete' ? 1 : 4,
    })),
    autoRetryCount: 0,
    userRetryCount: 0,
    modelSnapshot: params.modelSnapshot,
  });
}

export async function getLatestGenerationState(
  playthroughId: string
): Promise<IChapterGenerationStateDocument | null> {
  return ChapterGenerationState.findOne({ playthroughId })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getGenerationStateByChapter(
  chapterId: string
): Promise<IChapterGenerationStateDocument | null> {
  return ChapterGenerationState.findOne({ chapterId }).lean();
}

function getPhase(
  state: IChapterGenerationStateDocument,
  phase: GenerationPhase
) {
  const p = state.phases.find((p) => p.phase === phase);
  if (!p) throw new Error(`Phase ${phase} not found in generation state`);
  return p;
}

export async function startPhase(
  stateId: string,
  phase: GenerationPhase
): Promise<IChapterGenerationStateDocument> {
  return ChapterGenerationState.findByIdAndUpdate(
    stateId,
    {
      $set: {
        currentPhase: phase,
        status: 'running',
        [`phases.$[phase].status`]: 'running',
        [`phases.$[phase].lastStartedAt`]: new Date(),
      },
      $inc: { [`phases.$[phase].attempts`]: 1 },
      $unset: { error: '', completedAt: '' },
    },
    {
      arrayFilters: [{ 'phase.phase': phase }],
      returnDocument: 'after',
    }
  ) as Promise<IChapterGenerationStateDocument>;
}

export async function completePhase(
  stateId: string,
  phase: GenerationPhase,
  outputs?: Record<string, unknown>
): Promise<IChapterGenerationStateDocument> {
  const update: Record<string, unknown> = {
    [`phases.$[phase].status`]: 'completed',
    [`phases.$[phase].lastCompletedAt`]: new Date(),
    [`phases.$[phase].lastError`]: null,
  };
  if (outputs) {
    update[`phases.$[phase].outputs`] = outputs;
  }

  return ChapterGenerationState.findByIdAndUpdate(
    stateId,
    { $set: update },
    {
      arrayFilters: [{ 'phase.phase': phase }],
      returnDocument: 'after',
    }
  ) as Promise<IChapterGenerationStateDocument>;
}

export async function failPhase(
  stateId: string,
  phase: GenerationPhase,
  error: {
    message: string;
    code?: string;
    stack?: string;
    provider?: string;
    model?: string;
  }
): Promise<IChapterGenerationStateDocument> {
  const state = await ChapterGenerationState.findById(stateId);
  if (!state) throw new Error('Generation state not found');

  const phaseState = getPhase(state, phase);
  phaseState.status = 'failed';
  phaseState.lastError = {
    message: error.message,
    code: error.code,
    stack: error.stack,
    provider: error.provider,
    model: error.model,
    timestamp: new Date(),
  };

  state.autoRetryCount += 1;
  state.status = 'awaiting_user';
  state.error = {
    message: error.message,
    code: error.code,
    failedPhase: phase,
    provider: error.provider,
    model: error.model,
  };

  await state.save();
  return state;
}

export async function markAutoRetry(stateId: string): Promise<void> {
  await ChapterGenerationState.findByIdAndUpdate(stateId, {
    $inc: { autoRetryCount: 1 },
  });
}

export async function incrementUserRetryCount(stateId: string): Promise<IChapterGenerationStateDocument | null> {
  return ChapterGenerationState.findByIdAndUpdate(
    stateId,
    {
      $inc: { userRetryCount: 1 },
      $set: { status: 'running' },
      $unset: { error: '', completedAt: '' },
    },
    { returnDocument: 'after' }
  );
}

export async function completeGenerationState(
  stateId: string
): Promise<IChapterGenerationStateDocument | null> {
  return ChapterGenerationState.findByIdAndUpdate(
    stateId,
    {
      $set: {
        status: 'completed',
        currentPhase: 'complete',
        completedAt: new Date(),
        error: null,
      },
    },
    { returnDocument: 'after' }
  );
}

export async function cacheContextOutput(
  stateId: string,
  contextOutput: IContextOutput
): Promise<void> {
  await ChapterGenerationState.findByIdAndUpdate(stateId, {
    $set: { contextOutput },
  });
}

export function getNextPhase(phase: GenerationPhase): GenerationPhase | null {
  const idx = PHASE_ORDER.indexOf(phase);
  return idx >= 0 && idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1]! : null;
}

export function isPhaseCompleted(
  state: IChapterGenerationStateDocument,
  phase: GenerationPhase
): boolean {
  const p = state.phases.find((p) => p.phase === phase);
  return p?.status === 'completed';
}

export function getPhaseAttempts(
  state: IChapterGenerationStateDocument,
  phase: GenerationPhase
): number {
  const p = state.phases.find((p) => p.phase === phase);
  return p?.attempts ?? 0;
}

export async function markEffectApplied(
  stateId: string,
  effectKey: string
): Promise<void> {
  await ChapterGenerationState.findByIdAndUpdate(stateId, {
    $addToSet: { appliedEffects: effectKey },
  });
}

export async function getAppliedEffects(
  stateId: string
): Promise<string[]> {
  const state = await ChapterGenerationState.findById(stateId).select('appliedEffects').lean();
  return state?.appliedEffects ?? [];
}

export async function resetPhaseForRetry(
  stateId: string,
  phase: GenerationPhase
): Promise<IChapterGenerationStateDocument | null> {
  return ChapterGenerationState.findByIdAndUpdate(
    stateId,
    {
      $set: {
        [`phases.$[phase].status`]: 'pending',
        [`phases.$[phase].lastError`]: null,
        status: 'running',
        currentPhase: phase,
      },
    },
    {
      arrayFilters: [{ 'phase.phase': phase }],
      returnDocument: 'after',
    }
  );
}
