import { Playthrough } from '../../models/Playthrough';
import { Arc } from '../../models/Arc';
import { Chapter } from '../../models/Chapter';
import { Character } from '../../models/Character';
import { UserSettings } from '../../models/UserSettings';
import { createUserProviderRegistry } from '../../providers/registry';
import type { UserProviderRegistry } from '../../providers/registry';
import type { IChapterDocument } from '../../models/Chapter';
import type { IPlaythroughDocument } from '../../models/Playthrough';
import type { IArcDocument } from '../../models/Arc';
import type { IUserSettingsDocument } from '../../models/UserSettings';

export interface ChapterPreparation {
  playthrough: IPlaythroughDocument;
  settings: IUserSettingsDocument;
  registry: UserProviderRegistry;
  arc: IArcDocument;
  chapter: IChapterDocument;
  chapterCount: number;
}

export async function prepareChapterGeneration(
  playthroughId: string,
  playerChoice: string,
  userId: string
): Promise<ChapterPreparation> {
  // 1. Load playthrough — verify ownership & active status
  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) throw new Error('Playthrough not found');
  if (playthrough.userId.toString() !== userId) throw new Error('Unauthorized');
  if (playthrough.status !== 'active') throw new Error('Playthrough is not active');

  // 1b. Protagonist must exist before generating any chapter
  const protagonist = await Character.findOne({ playthroughId, role: 'protagonist' }).lean();
  if (!protagonist) throw new Error('Protagonist must be created before starting the story');

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

  return { playthrough, settings, registry, arc, chapter, chapterCount };
}
