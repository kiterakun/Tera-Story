import { Playthrough } from '../../models/Playthrough';
import { Echo } from '../../models/Echo';
import { StoryCard } from '../../models/StoryCard';
import type { StoryCardRarity } from '../../models/StoryCard';
import { emit, emitToUser } from '../sseManager';
import { addXp, XP_REWARDS } from '../progressionService';
import { checkAchievements } from '../achievementService';
import { updateQuestProgress } from '../dailyService';
import { logEvent } from '../eventLogService';
import * as stateService from '../chapterGenerationStateService';

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
  stateId?: string;
  language?: string;
  tracker?: Set<string>;
}

async function shouldSkip(key: string, stateId?: string, tracker?: Set<string>): Promise<boolean> {
  if (tracker?.has(key)) return true;
  if (stateId) {
    const applied = await stateService.getAppliedEffects(stateId);
    return applied.includes(key);
  }
  return false;
}

async function markApplied(
  key: string,
  stateId?: string,
  tracker?: Set<string>
): Promise<void> {
  tracker?.add(key);
  if (stateId) {
    await stateService.markEffectApplied(stateId, key);
  }
}

export async function applyPostChapterEffects(params: PostChapterEffectsParams): Promise<void> {
  const {
    userId,
    playthroughId,
    worldId,
    chapterId,
    chapterIndex,
    playerChoice,
    content,
    stateId,
    language = 'en',
    tracker = new Set<string>(),
  } = params;

  const makeKey = (type: string) => `${playthroughId}:${chapterId}:${type}`;
  const log = async (type: string, severity: 'info' | 'success' | 'warning' | 'error', title: string, details?: Record<string, unknown>) => {
    await logEvent({
      playthroughId,
      chapterId,
      userId,
      type: type as import('../eventLogService').LogEventParams['type'],
      severity,
      source: 'postChapterEffects',
      title,
      details,
      language,
    });
  };

  // Award XP for scene completion
  const sceneXpKey = makeKey('scene_xp');
  if (!(await shouldSkip(sceneXpKey, stateId, tracker))) {
    try {
      addXp(userId, XP_REWARDS.scene_complete!, 'scene_complete', {
        playthroughId,
        sceneId: chapterId,
      });
      await markApplied(sceneXpKey, stateId, tracker);
      await log('xp_awarded', 'success', `XP awarded for completing scene ${chapterIndex + 1}`, { type: 'scene_complete' });
    } catch (err) {
      console.error('Failed to award scene XP:', err);
      await log('error', 'warning', 'Failed to award scene XP', { reason: String(err) });
    }
  }

  // Update daily quest progress: read_scenes
  const readQuestKey = makeKey('quest_read_scenes');
  if (!(await shouldSkip(readQuestKey, stateId, tracker))) {
    try {
      updateQuestProgress(userId, 'read_scenes', 1);
      await markApplied(readQuestKey, stateId, tracker);
      await log('quest_progress_updated', 'info', 'Daily quest progress updated: read_scenes', { questType: 'read_scenes' });
    } catch (err) {
      console.error('Failed to update read_scenes quest progress:', err);
      await log('error', 'warning', 'Failed to update read_scenes quest progress', { reason: String(err) });
    }
  }

  // Award XP for making a choice (if not the initial chapter)
  if (playerChoice && playerChoice.trim().length > 0) {
    const choiceXpKey = makeKey('choice_xp');
    if (!(await shouldSkip(choiceXpKey, stateId, tracker))) {
      try {
        addXp(userId, XP_REWARDS.choice_made!, 'choice_made', {
          playthroughId,
          sceneId: chapterId,
        });
        await markApplied(choiceXpKey, stateId, tracker);
        await log('xp_awarded', 'success', 'XP awarded for making a choice', { type: 'choice_made' });
      } catch (err) {
        console.error('Failed to award choice XP:', err);
        await log('error', 'warning', 'Failed to award choice XP', { reason: String(err) });
      }
    }

    // Update daily quest progress: make_choices
    const choiceQuestKey = makeKey('quest_make_choices');
    if (!(await shouldSkip(choiceQuestKey, stateId, tracker))) {
      try {
        updateQuestProgress(userId, 'make_choices', 1);
        await markApplied(choiceQuestKey, stateId, tracker);
        await log('quest_progress_updated', 'info', 'Daily quest progress updated: make_choices', { questType: 'make_choices' });
      } catch (err) {
        console.error('Failed to update make_choices quest progress:', err);
        await log('error', 'warning', 'Failed to update make_choices quest progress', { reason: String(err) });
      }
    }
  }

  // Plant Echo for major choices
  if (playerChoice && playerChoice.length > 200) {
    const echoKey = makeKey('echo');
    if (!(await shouldSkip(echoKey, stateId, tracker))) {
      try {
        await plantEcho(playthroughId, chapterId, chapterIndex, playerChoice);
        await markApplied(echoKey, stateId, tracker);
        emitToUser(userId, 'echo_planted', {
          playthroughId,
          chapterId,
          chapterIndex,
        });
        await log('echo_planted', 'success', 'Echo planted for major choice', { chapterIndex });
      } catch (err) {
        console.error('Failed to plant echo:', err);
        await log('error', 'warning', 'Failed to plant echo', { reason: String(err) });
      }
    }
  }

  // Check achievements for scene completed + choice made
  const achievementKey = makeKey('achievements');
  if (!(await shouldSkip(achievementKey, stateId, tracker))) {
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
      await markApplied(achievementKey, stateId, tracker);
      await log('achievement_checked', 'info', 'Achievements checked for scene completion', { chapterIndex });
    } catch (err) {
      console.error('Failed to check achievements:', err);
      await log('error', 'warning', 'Failed to check achievements', { reason: String(err) });
    }
  }

  // Create story card for pivotal scenes (every 5th chapter)
  if ((chapterIndex + 1) % 5 === 0) {
    const storyCardKey = makeKey('story_card');
    if (!(await shouldSkip(storyCardKey, stateId, tracker))) {
      try {
        await createStoryCard({
          userId,
          playthroughId,
          worldId,
          sceneId: chapterId,
          chapterIndex,
          content,
        });
        await markApplied(storyCardKey, stateId, tracker);
        await log('story_card_created', 'success', `Story card created for scene ${chapterIndex + 1}`, { chapterIndex });
      } catch (err) {
        console.error('Failed to create story card:', err);
        await log('error', 'warning', 'Failed to create story card', { reason: String(err) });
      }
    }
  }
}
