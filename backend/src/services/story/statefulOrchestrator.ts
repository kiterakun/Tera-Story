import { Playthrough } from '../../models/Playthrough';
import { Arc } from '../../models/Arc';
import { Chapter } from '../../models/Chapter';
import { Character } from '../../models/Character';
import { Item } from '../../models/Item';
import { SpecialItem } from '../../models/SpecialItem';
import { Organization } from '../../models/Organization';
import { Location } from '../../models/Location';
import { UserSettings } from '../../models/UserSettings';
import { World } from '../../models/World';
import { addLocation } from '../../agents/mapAgent';
import { createUserProviderRegistry } from '../../providers/registry';
import { runContextAgent } from '../../agents/contextAgent';
import { runWriterAgent } from '../../agents/writerAgent';
import { emit } from '../sseManager';
import { prepareChapterGeneration } from './chapterPreparation';
import { applyPostChapterEffects } from './postChapterEffects';
import * as stateService from '../chapterGenerationStateService';
import { withAgentRetry } from '../agentRetryService';
import { logEvent } from '../eventLogService';
import type { IChapterDocument } from '../../models/Chapter';
import { ChapterGenerationState } from '../../models/ChapterGenerationState';
import type { GenerationPhase, IChapterGenerationStateDocument } from '../../models/ChapterGenerationState';

export interface GenerationCallbacks {
  onToken?: (token: string) => void;
  onToolsStart?: () => void;
  onToolsComplete?: () => void;
}

const PHASE_ORDER: GenerationPhase[] = [
  'context',
  'writing',
  'tools',
  'post_effects',
  'travel',
  'complete',
];

async function loadUserSettings(userId: string) {
  let settings = await UserSettings.findOne({ userId });
  if (!settings) {
    settings = await UserSettings.create({
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
  }
  return settings;
}

async function ensureMapExists(
  playthrough: { worldId: import('mongoose').Types.ObjectId },
  registry: ReturnType<typeof createUserProviderRegistry>
): Promise<void> {
  const continentCount = await import('../../models/Continent').then((m) =>
    m.Continent.countDocuments({ worldId: playthrough.worldId })
  );
  if (continentCount === 0) {
    const world = await World.findById(playthrough.worldId).lean();
    if (world) {
      const { generateWorldMap } = await import('../../agents/mapAgent');
      generateWorldMap({
        worldId: playthrough.worldId.toString(),
        worldDescription: world.description,
        genre: world.genre,
        model: registry.getSupportModel(),
      }).catch((err: unknown) => console.error('[MapGen] Background map generation failed:', err));
    }
  }
}

function getNextPhase(phase: GenerationPhase): GenerationPhase | null {
  const idx = PHASE_ORDER.indexOf(phase);
  return idx >= 0 && idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1]! : null;
}

async function log(
  playthroughId: string,
  userId: string,
  type: Parameters<typeof logEvent>[0]['type'],
  severity: Parameters<typeof logEvent>[0]['severity'],
  title: string,
  options: { chapterId?: string; language?: string; details?: Record<string, unknown>; source?: string } = {}
) {
  await logEvent({
    playthroughId,
    chapterId: options.chapterId,
    userId,
    type,
    severity,
    source: options.source ?? 'statefulOrchestrator',
    title,
    description: '',
    details: options.details,
    language: options.language ?? 'en',
  });
}

async function runContextPhase(
  state: IChapterGenerationStateDocument,
  chapter: IChapterDocument,
  registry: ReturnType<typeof createUserProviderRegistry>,
  settings: { language: string }
): Promise<import('../../types/agent.types').IContextOutput> {
  if (state.contextOutput) {
    return state.contextOutput;
  }

  const result = await withAgentRetry(
    async () => {
      const output = await runContextAgent({
        playthroughId: state.playthroughId.toString(),
        currentArcId: state.arcId.toString(),
        playerChoice: state.playerChoice,
        userId: state.userId.toString(),
        model: registry.getContextModel(),
        language: settings.language,
      });
      return output;
    },
    {
      stateId: state._id.toString(),
      phase: 'context',
      playthroughId: state.playthroughId.toString(),
      chapterId: state.chapterId.toString(),
      userId: state.userId.toString(),
      language: settings.language,
      provider: state.modelSnapshot.contextAgent.provider,
      model: state.modelSnapshot.contextAgent.model,
    }
  );

  if (result.usage) {
    await Chapter.findByIdAndUpdate(chapter._id, {
      'metadata.contextTokens': result.usage.inputTokens,
    });
  }
  await stateService.cacheContextOutput(state._id.toString(), result);
  await log(
    state.playthroughId.toString(),
    state.userId.toString(),
    'context_agent_completed',
    'success',
    'Context agent completed',
    { chapterId: chapter._id.toString(), language: settings.language, details: { tokens: result.usage?.inputTokens } }
  );

  return result;
}

async function runWritingPhase(
  state: IChapterGenerationStateDocument,
  chapter: IChapterDocument,
  contextOutput: import('../../types/agent.types').IContextOutput,
  registry: ReturnType<typeof createUserProviderRegistry>,
  settings: { language: string },
  callbacks: GenerationCallbacks,
  playthroughWorldId: string
): Promise<{ text: string; usage?: { totalTokens: number; promptTokens: number; completionTokens: number } }> {
  // Reset chapter if resuming a failed writing phase
  if (chapter.content) {
    await Chapter.findByIdAndUpdate(chapter._id, {
      content: '',
      status: 'generating',
      toolsStatus: 'pending',
    });
  }

  const result = await withAgentRetry(
    async () => {
      const output = await runWriterAgent({
        contextOutput,
        playthroughId: state.playthroughId.toString(),
        arcId: state.arcId.toString(),
        chapterId: chapter._id.toString(),
        worldId: playthroughWorldId,
        userId: state.userId.toString(),
        model: registry.getWriterModel(),
        language: settings.language,
        onToken: callbacks.onToken,
      });
      return output;
    },
    {
      stateId: state._id.toString(),
      phase: 'writing',
      playthroughId: state.playthroughId.toString(),
      chapterId: chapter._id.toString(),
      userId: state.userId.toString(),
      language: settings.language,
      provider: state.modelSnapshot.writerAgent.provider,
      model: state.modelSnapshot.writerAgent.model,
    }
  );

  await log(
    state.playthroughId.toString(),
    state.userId.toString(),
    'writer_pass1_completed',
    'success',
    `Chapter written — ${result.text.length} characters`,
    { chapterId: chapter._id.toString(), language: settings.language, details: { contentLength: result.text.length } }
  );

  return result;
}

async function runToolsPhase(
  state: IChapterGenerationStateDocument,
  chapter: IChapterDocument,
  contextOutput: import('../../types/agent.types').IContextOutput,
  registry: ReturnType<typeof createUserProviderRegistry>,
  settings: { language: string },
  callbacks: GenerationCallbacks,
  playthroughWorldId: string
): Promise<void> {
  // Idempotency: clean entities created in this chapter and clear old choices
  const chapterId = chapter._id.toString();
  await Promise.all([
    Character.deleteMany({ playthroughId: state.playthroughId, createdInChapterId: chapterId }),
    Item.deleteMany({ playthroughId: state.playthroughId, createdInChapterId: chapterId }),
    SpecialItem.deleteMany({ playthroughId: state.playthroughId, createdInChapterId: chapterId }),
    Organization.deleteMany({ playthroughId: state.playthroughId, createdInChapterId: chapterId }),
  ]);
  await Chapter.findByIdAndUpdate(chapter._id, {
    choices: [],
    toolsStatus: 'running',
  });

  const handleToolCall = (toolName: string, result: unknown) => {
    log(
      state.playthroughId.toString(),
      state.userId.toString(),
      'phase_completed',
      'success',
      `Tool executed: ${toolName}`,
      {
        chapterId,
        language: settings.language,
        source: 'writerAgent',
        details: { toolName, result },
      }
    ).catch((err) => console.error('[StatefulOrchestrator] Tool log failed:', err));
  };

  await withAgentRetry(
    async () => {
      await runWriterAgent({
        contextOutput,
        playthroughId: state.playthroughId.toString(),
        arcId: state.arcId.toString(),
        chapterId,
        worldId: playthroughWorldId,
        userId: state.userId.toString(),
        model: registry.getWriterModel(),
        language: settings.language,
        skipPass1: true,
        onToolsStart: callbacks.onToolsStart,
        onToolsComplete: callbacks.onToolsComplete,
        onToolCall: handleToolCall,
      });
    },
    {
      stateId: state._id.toString(),
      phase: 'tools',
      playthroughId: state.playthroughId.toString(),
      chapterId,
      userId: state.userId.toString(),
      language: settings.language,
      provider: state.modelSnapshot.writerAgent.provider,
      model: state.modelSnapshot.writerAgent.model,
    }
  );

  await log(
    state.playthroughId.toString(),
    state.userId.toString(),
    'writer_pass2_completed',
    'success',
    'Game state updated',
    { chapterId, language: settings.language }
  );
}

async function runPostEffectsPhase(
  state: IChapterGenerationStateDocument,
  chapter: IChapterDocument,
  content: string,
  playthroughWorldId: string
): Promise<void> {
  await withAgentRetry(
    async () => {
      await applyPostChapterEffects({
        userId: state.userId.toString(),
        playthroughId: state.playthroughId.toString(),
        worldId: playthroughWorldId,
        chapterId: chapter._id.toString(),
        chapterIndex: chapter.chapterIndex,
        playerChoice: state.playerChoice,
        content,
        stateId: state._id.toString(),
        language: 'en',
      });
    },
    {
      stateId: state._id.toString(),
      phase: 'post_effects',
      playthroughId: state.playthroughId.toString(),
      chapterId: chapter._id.toString(),
      userId: state.userId.toString(),
      language: 'en',
    }
  );
}

async function runTravelPhase(
  state: IChapterGenerationStateDocument,
  chapter: IChapterDocument
): Promise<void> {
  await withAgentRetry(
    async () => {
      const playthrough = await Playthrough.findById(state.playthroughId);
      if (!playthrough) throw new Error('Playthrough not found');

      const selectedChoice = chapter.choices.find((c: { text: string; travelTo?: string }) => c.text === state.playerChoice);
      const travelTo = selectedChoice?.travelTo;
      if (!travelTo) return;

      const oldLocationId = playthrough.currentLocationId?.toString() ?? null;
      let locationDoc = await Location.findById(travelTo).lean();

      if (!locationDoc) {
        const createdLocation = await addLocation({
          regionId: travelTo,
          playthroughId: state.playthroughId.toString(),
          name: 'New Destination',
          description: 'Discovered during travel',
          type: 'wilderness',
          ...(oldLocationId ? { connectedTo: oldLocationId } : {}),
        });
        locationDoc = createdLocation.toObject();
      }

      if (!locationDoc) {
        throw new Error('Failed to resolve location for travel: ' + travelTo);
      }

      const newLocationId = locationDoc._id.toString();
      await Playthrough.findByIdAndUpdate(state.playthroughId, {
        $set: { currentLocationId: newLocationId, lastActiveAt: new Date() },
      });

      emit(state.playthroughId.toString(), 'location:travel', {
        from: oldLocationId,
        to: newLocationId,
        location: locationDoc,
      });
    },
    {
      stateId: state._id.toString(),
      phase: 'travel',
      playthroughId: state.playthroughId.toString(),
      chapterId: chapter._id.toString(),
      userId: state.userId.toString(),
      language: 'en',
    }
  );
}

async function runGenerationFromState(
  state: IChapterGenerationStateDocument,
  callbacks: GenerationCallbacks,
  reloadSettings: boolean
): Promise<{ chapter: IChapterDocument; content: string }> {
  const chapter = await Chapter.findById(state.chapterId);
  if (!chapter) throw new Error('Chapter not found for generation state');

  const playthrough = await Playthrough.findById(state.playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');

  // On manual resume, reload current user settings so model/provider changes apply.
  const settings = reloadSettings
    ? await loadUserSettings(state.userId.toString())
    : await UserSettings.findOne({ userId: state.userId });
  if (!settings) throw new Error('User settings not found');

  const registry = createUserProviderRegistry(settings.aiSettings);
  const language = settings.language;

  // Update running state snapshot for manual retries
  if (reloadSettings) {
    await stateService.incrementUserRetryCount(state._id.toString());
    await ChapterGenerationState.findByIdAndUpdate(state._id, {
      $set: { modelSnapshot: settings.aiSettings },
    });
  }

  let contextOutput: import('../../types/agent.types').IContextOutput | undefined =
    state.contextOutput ?? undefined;
  let writerResult: { text: string; usage?: { totalTokens: number; promptTokens: number; completionTokens: number } } | undefined;

  // Start from current phase if resuming, otherwise context
  let phase: GenerationPhase = state.currentPhase;
  while (phase) {
    if (stateService.isPhaseCompleted(state, phase) && phase !== 'complete') {
      if (phase === 'context' && state.contextOutput) contextOutput = state.contextOutput;
      phase = getNextPhase(phase) ?? 'complete';
      continue;
    }

    if (phase === 'context') {
      contextOutput = await runContextPhase(state, chapter, registry, { language });
    } else if (phase === 'writing') {
      if (!contextOutput) throw new Error('Missing context output before writing phase');
      writerResult = await runWritingPhase(state, chapter, contextOutput, registry, { language }, callbacks, playthrough.worldId.toString());
    } else if (phase === 'tools') {
      if (!contextOutput) throw new Error('Missing context output before tools phase');
      await runToolsPhase(state, chapter, contextOutput, registry, { language }, callbacks, playthrough.worldId.toString());
    } else if (phase === 'post_effects') {
      const content = writerResult?.text ?? chapter.content;
      if (!content) throw new Error('Missing chapter content before post effects');
      await runPostEffectsPhase(state, chapter, content, playthrough.worldId.toString());
    } else if (phase === 'travel') {
      await runTravelPhase(state, chapter);
    } else if (phase === 'complete') {
      break;
    }

    phase = getNextPhase(phase) ?? 'complete';
  }

  // Save writer token usage
  if (writerResult?.usage) {
    await Chapter.findByIdAndUpdate(chapter._id, {
      'metadata.writerTokens': writerResult.usage.totalTokens,
      'metadata.writerPromptTokens': writerResult.usage.promptTokens,
      'metadata.writerCompletionTokens': writerResult.usage.completionTokens,
    });
  }

  await stateService.completeGenerationState(state._id.toString());
  const updatedChapter = await Chapter.findById(chapter._id).lean();

  emit(state.playthroughId.toString(), 'chapter:completed', {
    playthroughId: state.playthroughId.toString(),
    chapterId: chapter._id.toString(),
    chapterIndex: chapter.chapterIndex,
    arcId: state.arcId.toString(),
  });

  await log(
    state.playthroughId.toString(),
    state.userId.toString(),
    'chapter_generation_completed',
    'success',
    `Chapter ${chapter.chapterIndex + 1} generated`,
    { chapterId: chapter._id.toString(), language, details: { chapterIndex: chapter.chapterIndex } }
  );

  return {
    chapter: updatedChapter ?? chapter,
    content: writerResult?.text ?? chapter.content ?? '',
  };
}

export async function generateChapter(
  playthroughId: string,
  playerChoice: string,
  userId: string
): Promise<{ chapter: IChapterDocument; content: string }> {
  const prep = await prepareChapterGeneration(playthroughId, playerChoice, userId);
  await ensureMapExists(prep.playthrough, prep.registry);

  const state = await stateService.createGenerationState({
    playthroughId,
    chapterId: prep.chapter._id.toString(),
    arcId: prep.arc._id.toString(),
    userId,
    playerChoice,
    modelSnapshot: prep.settings.aiSettings,
  });

  await log(playthroughId, userId, 'chapter_generation_started', 'info', 'Chapter generation started', {
    chapterId: prep.chapter._id.toString(),
    language: prep.settings.language,
    details: { chapterIndex: prep.chapterCount },
  });

  try {
    return await runGenerationFromState(state, {}, false);
  } catch (err) {
    await handleGenerationError(state);
    throw err;
  }
}

export async function generateChapterStream(
  playthroughId: string,
  playerChoice: string,
  userId: string,
  onToken: (token: string) => void,
  onToolsStart?: () => void,
  onToolsComplete?: () => void
): Promise<{ chapter: IChapterDocument; content: string }> {
  const prep = await prepareChapterGeneration(playthroughId, playerChoice, userId);

  const state = await stateService.createGenerationState({
    playthroughId,
    chapterId: prep.chapter._id.toString(),
    arcId: prep.arc._id.toString(),
    userId,
    playerChoice,
    modelSnapshot: prep.settings.aiSettings,
  });

  const callbacks: GenerationCallbacks = { onToken, onToolsStart, onToolsComplete };

  await log(playthroughId, userId, 'chapter_generation_started', 'info', 'Chapter generation started (stream)', {
    chapterId: prep.chapter._id.toString(),
    language: prep.settings.language,
    details: { chapterIndex: prep.chapterCount },
  });

  try {
    return await runGenerationFromState(state, callbacks, false);
  } catch (err) {
    await handleGenerationError(state);
    throw err;
  }
}

export async function resumeChapter(
  playthroughId: string,
  userId: string,
  onToken?: (token: string) => void,
  onToolsStart?: () => void,
  onToolsComplete?: () => void
): Promise<{ chapter: IChapterDocument; content: string }> {
  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');

  const state = await stateService.getLatestGenerationState(playthroughId);
  if (!state) throw new Error('No generation state found to resume');
  if (state.status === 'running') throw new Error('Generation is already in progress');
  if (state.status === 'completed') throw new Error('Generation already completed');

  const callbacks: GenerationCallbacks = { onToken, onToolsStart, onToolsComplete };

  await log(playthroughId, userId, 'chapter_retried', 'info', 'User resumed chapter generation', {
    chapterId: state.chapterId.toString(),
    language: 'en',
    details: { failedPhase: state.error?.failedPhase, userRetryCount: state.userRetryCount + 1 },
  });

  // Reset current phase to pending for retry
  await stateService.resetPhaseForRetry(state._id.toString(), state.currentPhase);

  try {
    return await runGenerationFromState(state, callbacks, true);
  } catch (err) {
    // Reload state from DB before marking error, in case a sub-phase failed
    const freshState = await stateService.getLatestGenerationState(playthroughId);
    if (freshState) await handleGenerationError(freshState);
    throw err;
  }
}

async function handleGenerationError(
  state: IChapterGenerationStateDocument
): Promise<void> {
  const chapter = await Chapter.findById(state.chapterId).lean();
  if (!chapter) return;

  if (!chapter.content) {
    await Chapter.findByIdAndUpdate(chapter._id, { status: 'failed' });
  } else if (chapter.toolsStatus !== 'completed') {
    await Chapter.findByIdAndUpdate(chapter._id, { toolsStatus: 'failed' });
  }
}

// Convenience function for route-level retry compatibility
export async function retryChapter(
  chapterId: string,
  userId: string
): Promise<{ chapter: IChapterDocument; content: string }> {
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) throw new Error('Chapter not found');
  return resumeChapter(chapter.playthroughId.toString(), userId);
}

export async function retryChapterTools(
  chapterId: string,
  userId: string
): Promise<{ chapter: IChapterDocument; content: string }> {
  return retryChapter(chapterId, userId);
}

export async function summarizeCurrentArc(
  playthroughId: string,
  userId: string
): Promise<{
  completedArc: {
    _id: import('mongoose').Types.ObjectId;
    title: string;
    arcIndex: number;
    summary: string;
  };
  newArc: {
    _id: import('mongoose').Types.ObjectId;
    title: string;
    arcIndex: number;
  };
}> {
  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');

  const currentArc = await Arc.findOne({ playthroughId, status: 'active' }).sort({ arcIndex: -1 });
  if (!currentArc) throw new Error('No active arc found');

  const chapters = await Chapter.find({ arcId: currentArc._id })
    .sort({ chapterIndex: 1 })
    .select('content chapterIndex')
    .lean();

  if (chapters.length === 0) throw new Error('No chapters in current arc to summarize');

  const settings = await loadUserSettings(userId);
  const registry = createUserProviderRegistry(settings.aiSettings);

  const { streamText } = await import('ai');
  const chapterTexts = chapters
    .map((ch: { content?: string; chapterIndex: number }) => `[Chapter ${ch.chapterIndex + 1}]\n${ch.content ?? ''}`)
    .join('\n---\n');

  const summaryPrompt = `Summarize the following story arc into a concise narrative summary (2-4 paragraphs). Capture the key events, character developments, important decisions, and plot points. This summary will be used as context for future chapters, so include all critically important information.\n\nLanguage: ${settings.language}\n\n${chapterTexts}`;

  const result = streamText({
    model: registry.getContextModel(),
    system: 'You are a story analyst. Create concise but comprehensive arc summaries that preserve all important plot information. Respond with the summary text only, no JSON or formatting.',
    prompt: summaryPrompt,
    temperature: 0.3,
  });

  const summary = await result.text;

  currentArc.status = 'completed';
  currentArc.summary = summary;
  await currentArc.save();

  const newArc = await Arc.create({
    playthroughId,
    arcIndex: currentArc.arcIndex + 1,
    title: `Arc ${currentArc.arcIndex + 2}`,
    status: 'active',
  });

  console.log(`[Story] Arc ${currentArc.arcIndex} summarized and completed. New arc ${newArc.arcIndex} created.`);

  return {
    completedArc: {
      _id: currentArc._id,
      title: currentArc.title,
      arcIndex: currentArc.arcIndex,
      summary,
    },
    newArc: {
      _id: newArc._id,
      title: newArc.title,
      arcIndex: newArc.arcIndex,
    },
  };
}
