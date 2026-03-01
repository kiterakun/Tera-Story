import { Playthrough } from '../models/Playthrough';
import { Arc } from '../models/Arc';
import { Chapter } from '../models/Chapter';
import { UserSettings } from '../models/UserSettings';
import { createUserProviderRegistry } from '../providers/registry';
import { runContextAgent } from '../agents/contextAgent';
import { runWriterAgent } from '../agents/writerAgent';

export async function generateChapter(
  playthroughId: string,
  playerChoice: string,
  userId: string,
  abortSignal?: AbortSignal
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

  // 5. Create placeholder chapter (content updated after stream via writer tools)
  const chapter = await Chapter.create({
    content: '',
    arcId: arc._id,
    playthroughId,
    chapterIndex: chapterCount,
    metadata: { generatedAt: new Date() },
  });
  console.log(`[Story] Placeholder chapter created: id=${chapter._id}, arcId=${arc._id}, index=${chapterCount}`);

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
  // 7. Run writer agent (synchronous — returns StreamTextResult directly)
  const result = runWriterAgent({
    contextOutput,
    playthroughId,
    arcId: arc._id.toString(),
    chapterId: chapter._id.toString(),
    worldId: playthrough.worldId.toString(),
    userId,
    model: registry.getWriterModel(),
    language: settings.language,
    abortSignal,
  });

  // 8. Return wrapped — StreamTextResult is thenable, so returning it directly
  //    from an async function would auto-await it, consuming the stream.
  //    Wrapping in { stream } prevents JavaScript from unwrapping the thenable.
  return { stream: result };
}
