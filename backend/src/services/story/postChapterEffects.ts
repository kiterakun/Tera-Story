import { Playthrough } from '../../models/Playthrough';
import { Echo } from '../../models/Echo';
import { StoryCard } from '../../models/StoryCard';
import type { StoryCardRarity } from '../../models/StoryCard';
import { emit, emitToUser } from '../sseManager';
import { addXp, XP_REWARDS } from '../progressionService';
import { checkAchievements } from '../achievementService';
import { updateQuestProgress } from '../dailyService';

const ECHO_DELAYS = [5, 10, 20] as const;
const ECHO_TYPES = ['mercy', 'betrayal', 'discovery', 'consequence'] as const;

export async function plantEcho(
  playthroughId: string,
  chapterId: string,
  chapterIndex: number,
  playerChoice: string
): Promise<void> {
  const delay = ECHO_DELAYS[Math.floor(Math.random() * ECHO_DELAYS.length)]!;
  const echoType = ECHO_TYPES[Math.floor(Math.random() * ECHO_TYPES.length)]!;

  const echo = new Echo({
    playthroughId,
    triggerChapterId: chapterId,
    triggerChapterIndex: chapterIndex,
    targetChapterIndex: chapterIndex + delay,
    type: echoType,
    description: `Consequence of choice: "${playerChoice.slice(0, 200)}"`,
    minChapterDelay: delay,
    maxChapterDelay: delay + 5,
  });

  await echo.save();

  await Playthrough.findByIdAndUpdate(playthroughId, {
    $inc: { echoesCount: 1 },
  });

  emit(playthroughId, 'echo:planted', {
    playthroughId,
    echoId: echo._id.toString(),
    type: echoType,
    triggerChapterIndex: chapterIndex,
    targetChapterIndex: chapterIndex + delay,
  });
}

export async function createStoryCard(params: {
  userId: string;
  playthroughId: string;
  worldId: string;
  sceneId: string;
  chapterIndex: number;
  content: string;
}): Promise<void> {
  const { userId, playthroughId, worldId, sceneId, chapterIndex, content } = params;

  const pivotIndex = chapterIndex + 1;
  const rarity: StoryCardRarity =
    pivotIndex >= 20 ? 'epic' : pivotIndex >= 15 ? 'rare' : pivotIndex >= 10 ? 'uncommon' : 'common';
  const category = pivotIndex % 10 === 0 ? 'milestone' : 'story';

  const firstLine = content.split('\n')[0]?.slice(0, 120) ?? '';
  const title = firstLine || `Scene ${pivotIndex}`;

  const secondLine = content.split('\n')[1]?.slice(0, 200) ?? '';

  await StoryCard.create({
    userId,
    playthroughId,
    worldId,
    sceneId,
    imageUrl: `https://placehold.co/512x512/png?text=Scene+${pivotIndex}`,
    title,
    description: secondLine || `A pivotal moment from scene ${pivotIndex}.`,
    rarity,
    category,
    unlockedAt: new Date(),
  });
}

export interface PostChapterEffectsParams {
  userId: string;
  playthroughId: string;
  worldId: string;
  chapterId: string;
  chapterIndex: number;
  playerChoice: string;
  content: string;
}

export async function applyPostChapterEffects(params: PostChapterEffectsParams): Promise<void> {
  const { userId, playthroughId, worldId, chapterId, chapterIndex, playerChoice, content } = params;

  // Award XP for scene completion
  try {
    addXp(userId, XP_REWARDS.scene_complete!, 'scene_complete', {
      playthroughId,
      sceneId: chapterId,
    });
  } catch (err) {
    console.error('Failed to award scene XP:', err);
  }

  // Update daily quest progress: read_scenes
  try {
    updateQuestProgress(userId, 'read_scenes', 1);
  } catch (err) {
    console.error('Failed to update read_scenes quest progress:', err);
  }

  // Award XP for making a choice (if not the initial chapter)
  if (playerChoice && playerChoice.trim().length > 0) {
    try {
      addXp(userId, XP_REWARDS.choice_made!, 'choice_made', {
        playthroughId,
        sceneId: chapterId,
      });
    } catch (err) {
      console.error('Failed to award choice XP:', err);
    }
  }

  // Update daily quest progress: make_choices
  try {
    updateQuestProgress(userId, 'make_choices', 1);
  } catch (err) {
    console.error('Failed to update make_choices quest progress:', err);
  }

  // Plant Echo for major choices
  if (playerChoice && playerChoice.length > 200) {
    try {
      await plantEcho(playthroughId, chapterId, chapterIndex, playerChoice);
      emitToUser(userId, 'echo_planted', {
        playthroughId,
        chapterId,
        chapterIndex,
      });
    } catch (err) {
      console.error('Failed to plant echo:', err);
    }
  }

  // Check achievements for scene completed + choice made
  try {
    checkAchievements(userId, {
      type: 'scene_completed',
      data: { playthroughId, sceneId: chapterId, chapterIndex },
    });
    if (playerChoice && playerChoice.trim().length > 0) {
      checkAchievements(userId, {
        type: 'choice_made',
        data: { playthroughId, sceneId: chapterId, chapterIndex },
      });
    }
  } catch (err) {
    console.error('Failed to check achievements:', err);
  }

  // Create story card for pivotal scenes (every 5th chapter)
  if ((chapterIndex + 1) % 5 === 0) {
    try {
      await createStoryCard({
        userId,
        playthroughId,
        worldId,
        sceneId: chapterId,
        chapterIndex,
        content,
      });
    } catch (err) {
      console.error('Failed to create story card:', err);
    }
  }
}
