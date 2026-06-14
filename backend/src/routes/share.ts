import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { Playthrough } from '../models/Playthrough';
import { StoryCard } from '../models/StoryCard';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

const shareIdParam = z.object({
  shareId: z.string().min(1).max(128),
});

// GET /api/share/story/:shareId - Public story share page (no auth)
router.get('/story/:shareId', validate(shareIdParam, 'params'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params as z.infer<typeof shareIdParam>;
    const playthrough = await Playthrough.findOne({ shareId, deletedAt: null })
      .select('name worldId userId chronicleCache completedAt status')
      .lean();

    if (!playthrough) {
      res.status(404).json({ status: 'error', message: 'Story not found' });
      return;
    }

    const owner = await User.findById(playthrough.userId)
      .select('username displayName avatar privacySettings')
      .lean();

    const isPublic = owner?.privacySettings?.storyVisibility === 'public';
    const maskedOwner = {
      username: owner?.username ?? 'Unknown',
      ...(isPublic ? {
        displayName: owner?.displayName,
        avatar: owner?.avatar,
      } : {}),
    };

    res.json({
      status: 'success',
      data: {
        name: playthrough.name,
        worldId: playthrough.worldId,
        status: playthrough.status,
        completedAt: playthrough.completedAt,
        chronicle: playthrough.chronicleCache ?? null,
        owner: maskedOwner,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Share story error:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/share/card/:shareId - Public card share page (no auth)
router.get('/card/:shareId', validate(shareIdParam, 'params'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params as z.infer<typeof shareIdParam>;
    const card = await StoryCard.findOne({ publicShareUrl: shareId })
      .select('title description imageUrl thumbnailUrl rarity category unlockedAt worldId userId')
      .lean();

    if (!card) {
      res.status(404).json({ status: 'error', message: 'Card not found' });
      return;
    }

    const owner = await User.findById(card.userId)
      .select('username displayName avatar privacySettings')
      .lean();

    const isPublic = owner?.privacySettings?.achievementVisibility === 'public';
    const maskedOwner = {
      username: owner?.username ?? 'Unknown',
      ...(isPublic ? {
        displayName: owner?.displayName,
        avatar: owner?.avatar,
      } : {}),
    };

    res.json({
      status: 'success',
      data: {
        title: card.title,
        description: card.description,
        imageUrl: card.imageUrl,
        thumbnailUrl: card.thumbnailUrl,
        rarity: card.rarity,
        category: card.category,
        unlockedAt: card.unlockedAt,
        worldId: card.worldId,
        owner: maskedOwner,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Share card error:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
