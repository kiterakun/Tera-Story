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

  // 4. Determine chapter index: count existing chapters in this arc
  const chapterCount = await Chapter.countDocuments({ arcId: arc._id });

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
