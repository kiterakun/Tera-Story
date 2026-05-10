import { Playthrough } from '../models/Playthrough';
import { Arc } from '../models/Arc';
import { Chapter } from '../models/Chapter';
import { Character } from '../models/Character';
import { Item } from '../models/Item';
import { SpecialItem } from '../models/SpecialItem';
import { UserSettings } from '../models/UserSettings';
import { createUserProviderRegistry } from '../providers/registry';
import { runContextAgent } from '../agents/contextAgent';
import { runWriterAgent } from '../agents/writerAgent';

export async function generateChapter(
  playthroughId: string,
  playerChoice: string,
  userId: string
) {
  console.log(`[Story] generateChapter called: playthrough=${playthroughId}, choice="${playerChoice.slice(0, 50)}"`);
  // 1. Load playthrough — verify ownership & active status
  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');
  if (playthrough.status !== 'active') throw new Error('Playthrough is not active');

  // 2. Load user AI settings → build provider registry (auto-create defaults if missing)
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
  const registry = createUserProviderRegistry(settings.aiSettings);

  // 3. Determine current arc: find most recent active, or create first one
  let arc = await Arc.findOne({ playthroughId, status: 'active' }).sort({ arcIndex: -1 });
  if (!arc) {
    arc = await Arc.create({
      playthroughId,
      arcIndex: 0,
      title: 'Arc 1',
      status: 'active',
    });
  }

  // 4. Determine chapter index: count existing chapters across ALL arcs (global index)
  const chapterCount = await Chapter.countDocuments({ playthroughId });

  // 5. Create placeholder chapter with 'generating' status
  const chapter = await Chapter.create({
    content: '',
    arcId: arc._id,
    playthroughId,
    chapterIndex: chapterCount,
    status: 'generating',
    playerChoice,
    metadata: { generatedAt: new Date() },
  });
  console.log(`[Story] Placeholder chapter created: id=${chapter._id}, arcId=${arc._id}, index=${chapterCount}`);

  try {
    // 6. Run context agent — analyse story state and produce outline
    const contextOutput = await runContextAgent({
      playthroughId,
      currentArcId: arc._id.toString(),
      playerChoice,
      userId,
      model: registry.getContextModel(),
      language: settings.language,
    });
    console.log(`[Story] Context agent completed for playthrough=${playthroughId}, outline length=${contextOutput.outline.length}`);

    // Save context token usage to chapter metadata
    if (contextOutput.usage) {
      await Chapter.findByIdAndUpdate(chapter._id, {
        'metadata.contextTokens': contextOutput.usage.inputTokens,
      });
    }

    console.log(`[Story] Starting writer agent for chapter=${chapter._id}, arc=${arc._id}`);
    // 7. Run writer agent (now async — waits for full response)
    const result = await runWriterAgent({
      contextOutput,
      playthroughId,
      arcId: arc._id.toString(),
      chapterId: chapter._id.toString(),
      worldId: playthrough.worldId.toString(),
      userId,
      model: registry.getWriterModel(),
      language: settings.language,
    });

    // 8. Reload chapter to get choices populated by generateChoices tool
    const updatedChapter = await Chapter.findById(chapter._id).lean();

    // Save writer token usage to chapter metadata
    if (result.usage) {
      await Chapter.findByIdAndUpdate(chapter._id, {
        'metadata.writerTokens': result.usage.totalTokens,
        'metadata.writerPromptTokens': result.usage.promptTokens,
        'metadata.writerCompletionTokens': result.usage.completionTokens,
      });
    }
    console.log(`[Story] Token usage — context: ${contextOutput.usage?.inputTokens || 0}, writer: ${result.usage?.totalTokens || 0} (${result.usage?.promptTokens || 0}p + ${result.usage?.completionTokens || 0}c)`);
    console.log(`[Story] Chapter generation completed: id=${chapter._id}, content length=${result.text.length}`);
    return {
      chapter: updatedChapter,
      content: result.text,
    };
  } catch (err) {
    // Only mark as failed if content was never written (Pass 1 failed).
    // If Pass 1 succeeded (content exists), the chapter is still readable
    // even if Pass 2 (tools) failed — mark toolsStatus as 'failed'.
    const existing = await Chapter.findById(chapter._id).lean();
    if (!existing || !existing.content) {
      await Chapter.findByIdAndUpdate(chapter._id, { status: 'failed' });
    } else {
      // Content exists — Pass 1 succeeded but Pass 2 failed
      await Chapter.findByIdAndUpdate(chapter._id, { toolsStatus: 'failed' });
    }
    throw err;
  }
}

/**
 * Streaming variant of generateChapter — passes an onToken callback
 * so callers (SSE endpoint) can stream text tokens in real-time.
 */
export async function generateChapterStream(
  playthroughId: string,
  playerChoice: string,
  userId: string,
  onToken: (token: string) => void,
  onToolsStart?: () => void,
  onToolsComplete?: () => void
) {
  console.log(`[Story] generateChapterStream called: playthrough=${playthroughId}, choice="${playerChoice.slice(0, 50)}"`);

  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');
  if (playthrough.status !== 'active') throw new Error('Playthrough is not active');

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
  const registry = createUserProviderRegistry(settings.aiSettings);

  let arc = await Arc.findOne({ playthroughId, status: 'active' }).sort({ arcIndex: -1 });
  if (!arc) {
    arc = await Arc.create({
      playthroughId,
      arcIndex: 0,
      title: 'Arc 1',
      status: 'active',
    });
  }

  const chapterCount = await Chapter.countDocuments({ playthroughId });
  const chapter = await Chapter.create({
    content: '',
    arcId: arc._id,
    playthroughId,
    chapterIndex: chapterCount,
    status: 'generating',
    playerChoice,
    metadata: { generatedAt: new Date() },
  });

  try {
    const contextOutput = await runContextAgent({
      playthroughId,
      currentArcId: arc._id.toString(),
      playerChoice,
      userId,
      model: registry.getContextModel(),
      language: settings.language,
    });

    if (contextOutput.usage) {
      await Chapter.findByIdAndUpdate(chapter._id, {
        'metadata.contextTokens': contextOutput.usage.inputTokens,
      });
    }

    const result = await runWriterAgent({
      contextOutput,
      playthroughId,
      arcId: arc._id.toString(),
      chapterId: chapter._id.toString(),
      worldId: playthrough.worldId.toString(),
      userId,
      model: registry.getWriterModel(),
      language: settings.language,
      onToken,
      onToolsStart,
      onToolsComplete,
    });

    // Save writer token usage to chapter metadata
    if (result.usage) {
      await Chapter.findByIdAndUpdate(chapter._id, {
        'metadata.writerTokens': result.usage.totalTokens,
        'metadata.writerPromptTokens': result.usage.promptTokens,
        'metadata.writerCompletionTokens': result.usage.completionTokens,
      });
    }
    console.log(`[Story] Token usage — context: ${contextOutput.usage?.inputTokens || 0}, writer: ${result.usage?.totalTokens || 0} (${result.usage?.promptTokens || 0}p + ${result.usage?.completionTokens || 0}c)`);
    const updatedChapter = await Chapter.findById(chapter._id).lean();
    return {
      chapter: updatedChapter,
      content: result.text,
    };
  } catch (err) {
    const existing = await Chapter.findById(chapter._id).lean();
    if (!existing || !existing.content) {
      await Chapter.findByIdAndUpdate(chapter._id, { status: 'failed' });
    } else {
      await Chapter.findByIdAndUpdate(chapter._id, { toolsStatus: 'failed' });
    }
    throw err;
  }
}

export async function retryChapter(
  chapterId: string,
  userId: string
) {
  console.log(`[Story] retryChapter called: chapter=${chapterId}`);

  // 1. Find the failed chapter
  const failedChapter = await Chapter.findById(chapterId);
  if (!failedChapter) throw new Error('Chapter not found');

  // 2. Verify ownership via playthrough
  const playthrough = await Playthrough.findById(failedChapter.playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');

  // 3. Delete entities created during the failed chapter
  await Promise.all([
    Character.deleteMany({ playthroughId: failedChapter.playthroughId, createdInChapterId: chapterId }),
    Item.deleteMany({ playthroughId: failedChapter.playthroughId, createdInChapterId: chapterId }),
    SpecialItem.deleteMany({ playthroughId: failedChapter.playthroughId, createdInChapterId: chapterId }),
  ]);

  // 4. Delete the failed chapter
  const playerChoice = failedChapter.playerChoice || 'Continue the story';
  await Chapter.findByIdAndDelete(chapterId);

  console.log(`[Story] Failed chapter deleted, retrying with choice: "${playerChoice.slice(0, 50)}"`);

  // 5. Regenerate the chapter
  return generateChapter(
    failedChapter.playthroughId.toString(),
    playerChoice,
    userId
  );
}

/**
 * Retry ONLY Pass 2 (tools) for a chapter where content is OK but tools failed.
 * Deletes entities created in the failed pass, then re-runs writerAgent Pass 2.
 */
export async function retryChapterTools(
  chapterId: string,
  userId: string
) {
  console.log(`[Story] retryChapterTools called: chapter=${chapterId}`);

  // 1. Find the chapter
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) throw new Error('Chapter not found');
  if (!chapter.content) throw new Error('Chapter has no content — use full retry instead');
  if (chapter.toolsStatus !== 'failed') throw new Error('Tools did not fail for this chapter');

  // 2. Verify ownership
  const playthrough = await Playthrough.findById(chapter.playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');

  // 3. Load user settings
  let settings = await UserSettings.findOne({ userId });
  if (!settings) throw new Error('User settings not found');
  const registry = createUserProviderRegistry(settings.aiSettings);

  // 4. Delete entities created during the failed chapter's tool pass
  await Promise.all([
    Character.deleteMany({ playthroughId: chapter.playthroughId, createdInChapterId: chapterId }),
    Item.deleteMany({ playthroughId: chapter.playthroughId, createdInChapterId: chapterId }),
    SpecialItem.deleteMany({ playthroughId: chapter.playthroughId, createdInChapterId: chapterId }),
  ]);

  // Clear old choices so they can be regenerated
  await Chapter.findByIdAndUpdate(chapterId, { choices: [], toolsStatus: 'pending' });

  // 5. Run context agent to get current state
  const arcId = chapter.arcId.toString();
  const contextOutput = await runContextAgent({
    playthroughId: chapter.playthroughId.toString(),
    currentArcId: arcId,
    playerChoice: chapter.playerChoice || 'Continue the story',
    userId,
    model: registry.getContextModel(),
    language: settings.language,
  });

  // 6. Run writer agent — Pass 2 only (skipPass1 = true)
  try {
    await runWriterAgent({
      contextOutput,
      playthroughId: chapter.playthroughId.toString(),
      arcId,
      chapterId,
      worldId: playthrough.worldId.toString(),
      userId,
      model: registry.getWriterModel(),
      language: settings.language,
      skipPass1: true,
    });
  } catch (err) {
    await Chapter.findByIdAndUpdate(chapterId, { toolsStatus: 'failed' });
    throw err;
  }

  // 7. Reload and return
  const updatedChapter = await Chapter.findById(chapterId).lean();
  console.log(`[Story] retryChapterTools completed for chapter=${chapterId}`);
  return {
    chapter: updatedChapter,
    content: chapter.content,
  };
}

/**
 * Summarize the current arc and transition to a new arc.
 * This reduces context by replacing full chapter text with a brief summary.
 */
export async function summarizeCurrentArc(
  playthroughId: string,
  userId: string
) {
  console.log(`[Story] summarizeCurrentArc called: playthrough=${playthroughId}`);

  // 1. Load playthrough — verify ownership
  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');

  // 2. Find current active arc
  const currentArc = await Arc.findOne({ playthroughId, status: 'active' }).sort({ arcIndex: -1 });
  if (!currentArc) throw new Error('No active arc found');

  // 3. Get all chapters in this arc
  const chapters = await Chapter.find({ arcId: currentArc._id })
    .sort({ chapterIndex: 1 })
    .select('content chapterIndex')
    .lean();

  if (chapters.length === 0) throw new Error('No chapters in current arc to summarize');

  // 4. Load user settings for AI model
  const settings = await UserSettings.findOne({ userId });
  if (!settings) throw new Error('User settings not found');
  const registry = createUserProviderRegistry(settings.aiSettings);

  // 5. Build prompt for summarization
  const { streamText } = await import('ai');
  const chapterTexts = chapters
    .map((ch) => `[Chapter ${ch.chapterIndex + 1}]\n${ch.content}`)
    .join('\n---\n');

  const summaryPrompt = `Summarize the following story arc into a concise narrative summary (2-4 paragraphs). Capture the key events, character developments, important decisions, and plot points. This summary will be used as context for future chapters, so include all critically important information.\n\nLanguage: ${settings.language}\n\n${chapterTexts}`;

  const result = streamText({
    model: registry.getContextModel(),
    system: 'You are a story analyst. Create concise but comprehensive arc summaries that preserve all important plot information. Respond with the summary text only, no JSON or formatting.',
    prompt: summaryPrompt,
    temperature: 0.3,
  });

  const summary = await result.text;

  // 6. Update current arc: mark completed with summary
  currentArc.status = 'completed';
  currentArc.summary = summary;
  await currentArc.save();

  // 7. Create new active arc
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
