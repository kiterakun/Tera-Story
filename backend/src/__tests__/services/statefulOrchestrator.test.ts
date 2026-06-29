import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';

// Mock the AI agents so we can drive the state machine deterministically.
const mockContextAgent = vi.fn();
const mockWriterAgent = vi.fn();
const mockPrepare = vi.fn();

vi.mock('../../agents/contextAgent', () => ({
  runContextAgent: (...args: unknown[]) => mockContextAgent(...args),
}));
vi.mock('../../agents/writerAgent', () => ({
  runWriterAgent: (...args: unknown[]) => mockWriterAgent(...args),
}));
vi.mock('../../services/story/chapterPreparation', () => ({
  prepareChapterGeneration: (...args: unknown[]) => mockPrepare(...args),
}));
vi.mock('../../services/sseManager', () => ({
  emit: vi.fn(),
  emitToUser: vi.fn(),
  addClient: vi.fn(),
  addUserClient: vi.fn(),
  removeClient: vi.fn(),
  removeUserClient: vi.fn(),
}));
vi.mock('../../agents/mapAgent', () => ({
  addLocation: vi.fn(),
  generateWorldMap: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../services/progressionService', () => ({
  addXp: vi.fn(),
  XP_REWARDS: { scene_complete: 10, choice_made: 5 },
}));
vi.mock('../../services/achievementService', () => ({
  checkAchievements: vi.fn(),
}));
vi.mock('../../services/dailyService', () => ({
  updateQuestProgress: vi.fn(),
}));

import { Playthrough } from '../../models/Playthrough';
import { Arc } from '../../models/Arc';
import { Chapter } from '../../models/Chapter';
import { Character } from '../../models/Character';
import { ChapterGenerationState } from '../../models/ChapterGenerationState';
import { EventLog } from '../../models/EventLog';
import { World } from '../../models/World';
import { UserSettings } from '../../models/UserSettings';
import { generateChapter, resumeChapter } from '../../services/story/statefulOrchestrator';

const baseContextOutput = {
  outline: 'Outline',
  filteredContext: 'ctx',
  activeCharacters: [],
  existingItems: [],
  existingSpecialItems: [],
  specialItemTemplateCategories: [],
  currentScene: 'scene',
  relevantPlotPoints: [],
  relationships: [],
  matureConsequences: [],
  activeCombat: null,
};

describe('statefulOrchestrator', () => {
  let playthroughId: string;
  let userId: string;
  let worldId: string;
  let chapterId: string;
  let arcId: string;

  beforeEach(async () => {
    await ChapterGenerationState.deleteMany({});
    await EventLog.deleteMany({});
    await Chapter.deleteMany({});
    await Character.deleteMany({});
    await Arc.deleteMany({});
    await Playthrough.deleteMany({});
    await World.deleteMany({});
    await UserSettings.deleteMany({});

    userId = new mongoose.Types.ObjectId().toString();
    worldId = (await World.create({ name: 'W', description: 'd', genre: 'fantasy', userId }))._id.toString();
    playthroughId = (
      await Playthrough.create({ name: 'PT', worldId, userId, status: 'active' })
    )._id.toString();
    arcId = (await Arc.create({ playthroughId, arcIndex: 0, title: 'Arc 1', status: 'active' }))._id.toString();
    chapterId = (
      await Chapter.create({
        content: '',
        arcId,
        playthroughId,
        chapterIndex: 0,
        status: 'generating',
        playerChoice: 'Continue the story',
        metadata: { generatedAt: new Date() },
      })
    )._id.toString();

    await UserSettings.create({
      userId,
      language: 'en',
      theme: 'dark',
      aiSettings: {
        contextAgent: { provider: 'openai', model: 'gpt-4o' },
        writerAgent: { provider: 'openai', model: 'gpt-4o' },
        supportAgent: { provider: 'openai', model: 'gpt-4o' },
        imageAgent: { provider: 'openai', model: 'dall-e-3' },
      },
    });

    const fakeModel = { id: 'fake-model' } as unknown;
    const fakeRegistry = {
      getContextModel: () => fakeModel,
      getWriterModel: () => fakeModel,
      getSupportModel: () => fakeModel,
    };

    mockContextAgent.mockResolvedValue({ ...baseContextOutput, usage: { inputTokens: 10, outputTokens: 5 } });
    mockWriterAgent.mockImplementation(async (params: { skipPass1?: boolean; chapterId?: string }) => {
      if (!params.skipPass1 && params.chapterId) {
        await Chapter.findByIdAndUpdate(params.chapterId, {
          content: 'Once upon a time...',
          status: 'completed',
          toolsStatus: 'pending',
        });
      }
      return {
        text: 'Once upon a time...',
        usage: { totalTokens: 100, promptTokens: 60, completionTokens: 40 },
      };
    });
    mockPrepare.mockResolvedValue({
      playthrough: {
        _id: new mongoose.Types.ObjectId(playthroughId),
        worldId: new mongoose.Types.ObjectId(worldId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      settings: {
        language: 'en',
        aiSettings: {
          contextAgent: { provider: 'openai', model: 'gpt-4o' },
          writerAgent: { provider: 'openai', model: 'gpt-4o' },
          supportAgent: { provider: 'openai', model: 'gpt-4o' },
          imageAgent: { provider: 'openai', model: 'dall-e-3' },
        },
      },
      registry: fakeRegistry,
      arc: { _id: new mongoose.Types.ObjectId(arcId) },
      chapter: { _id: new mongoose.Types.ObjectId(chapterId) },
      chapterCount: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('runs all phases to completion on a successful generation', async () => {
    const result = await generateChapter(playthroughId, 'Continue the story', userId);

    expect(result.content).toBe('Once upon a time...');
    expect(mockContextAgent).toHaveBeenCalledTimes(1);
    expect(mockWriterAgent).toHaveBeenCalledTimes(2); // Pass 1 + Pass 2

    const state = await ChapterGenerationState.findOne({ playthroughId }).lean();
    expect(state?.status).toBe('completed');
    const activePhases = state?.phases.filter((p) => p.phase !== 'complete') ?? [];
    expect(activePhases.every((p) => p.status === 'completed')).toBe(true);
  });

  it('pauses in awaiting_user after exhausting retries and resumes from the failed phase', async () => {
    // Make context agent always fail
    mockContextAgent.mockRejectedValue(new Error('provider down'));

    await expect(generateChapter(playthroughId, 'Continue the story', userId)).rejects.toThrow('provider down');

    const failedState = await ChapterGenerationState.findOne({ playthroughId }).lean();
    expect(failedState?.status).toBe('awaiting_user');
    expect(failedState?.error?.message).toBe('provider down');
    expect(failedState?.error?.failedPhase).toBe('context');

    // Now fix the agent and resume
    mockContextAgent.mockResolvedValue({ ...baseContextOutput, usage: { inputTokens: 10, outputTokens: 5 } });

    const result = await resumeChapter(playthroughId, userId);
    expect(result.content).toBe('Once upon a time...');

    const resumedState = await ChapterGenerationState.findOne({ playthroughId }).lean();
    expect(resumedState?.status).toBe('completed');
    expect(resumedState?.userRetryCount).toBe(1);
  });

  it('resumes from tools phase without re-running context or writing', async () => {
    // Succeed context + writing, fail tools
    mockWriterAgent.mockImplementation(async (params: { skipPass1?: boolean; chapterId?: string }) => {
      if (params.skipPass1) {
        throw new Error('tools crashed');
      }
      if (params.chapterId) {
        await Chapter.findByIdAndUpdate(params.chapterId, {
          content: 'Chapter text',
          status: 'completed',
          toolsStatus: 'pending',
        });
      }
      return {
        text: 'Chapter text',
        usage: { totalTokens: 50, promptTokens: 30, completionTokens: 20 },
      };
    });

    await expect(generateChapter(playthroughId, 'Continue the story', userId)).rejects.toThrow('tools crashed');

    const failedState = await ChapterGenerationState.findOne({ playthroughId }).lean();
    expect(failedState?.error?.failedPhase).toBe('tools');
    expect(failedState?.phases.find((p) => p.phase === 'context')?.status).toBe('completed');
    expect(failedState?.phases.find((p) => p.phase === 'writing')?.status).toBe('completed');

    const contextCallsBefore = mockContextAgent.mock.calls.length;

    // Fix tools and resume
    mockWriterAgent.mockResolvedValue({
      text: 'Chapter text',
      usage: { totalTokens: 50, promptTokens: 30, completionTokens: 20 },
    });

    const result = await resumeChapter(playthroughId, userId);
    expect(result.content).toBe('Chapter text');

    // Context should NOT have been re-run during resume
    expect(mockContextAgent.mock.calls.length).toBe(contextCallsBefore);

    const resumedState = await ChapterGenerationState.findOne({ playthroughId }).lean();
    expect(resumedState?.status).toBe('completed');
  });
});
