import { Router, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { StoryCard } from '../models/StoryCard';

const router = Router();

// --- Routes ---

// GET /api/gallery - List user's story cards
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };

    if (req.query.worldId) filter.worldId = req.query.worldId;
    if (req.query.rarity) filter.rarity = req.query.rarity;
    if (req.query.category) filter.category = req.query.category;

    let sortOption: Record<string, 1 | -1> = { unlockedAt: -1 };
    if (req.query.sort === 'rarity') {
      sortOption = { rarity: -1, unlockedAt: -1 };
    }

    const [cards, total, stats] = await Promise.all([
      StoryCard.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      StoryCard.countDocuments(filter),
      StoryCard.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$rarity', count: { $sum: 1 } } },
      ]),
    ]);

    const rarityCounts: Record<string, number> = { common: 0, uncommon: 0, rare: 0, epic: 0 };
    for (const stat of stats) {
      rarityCounts[stat._id as string] = stat.count;
    }

    res.json({
      status: 'success',
      data: {
        cards,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats: {
          total,
          ...rarityCounts,
        },
      },
    });
  } catch (err) {
    console.error('List gallery error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/gallery/stats - Gallery statistics
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalCards, byRarity, byCategory, recentUnlock] = await Promise.all([
      StoryCard.countDocuments({ userId }),
      StoryCard.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$rarity', count: { $sum: 1 } } },
      ]),
      StoryCard.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      StoryCard.find({ userId }).sort({ unlockedAt: -1 }).limit(5).lean(),
    ]);

    const rarityMap: Record<string, number> = {};
    for (const r of byRarity) rarityMap[r._id as string] = r.count;

    const categoryMap: Record<string, number> = {};
    for (const c of byCategory) categoryMap[c._id as string] = c.count;

    res.json({
      status: 'success',
      data: {
        totalCards,
        byRarity: rarityMap,
        byCategory: categoryMap,
        recentUnlock,
      },
    });
  } catch (err) {
    console.error('Gallery stats error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/gallery/:cardId - Get card detail
router.get('/:cardId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { cardId } = req.params;

    const card = await StoryCard.findById(cardId).lean();
    if (!card) {
      res.status(404).json({ status: 'error', message: 'Card not found' });
      return;
    }
    if (card.userId.toString() !== userId) {
      res.status(403).json({ status: 'error', message: 'Access denied' });
      return;
    }

    res.json({ status: 'success', data: { card } });
  } catch (err) {
    console.error('Get card detail error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/gallery/:cardId/share - Mark card as shared
router.post('/:cardId/share', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { cardId } = req.params;

    const card = await StoryCard.findById(cardId);
    if (!card) {
      res.status(404).json({ status: 'error', message: 'Card not found' });
      return;
    }
    if (card.userId.toString() !== userId) {
      res.status(403).json({ status: 'error', message: 'Access denied' });
      return;
    }

    // Generate public share URL if not exists
    const publicShareUrl = card.publicShareUrl ?? crypto.randomUUID();

    const updated = await StoryCard.findByIdAndUpdate(
      cardId,
      {
        $set: {
          shared: true,
          publicShareUrl,
        },
        $inc: { shareCount: 1 },
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      res.status(404).json({ status: 'error', message: 'Card not found' });
      return;
    }

    res.json({
      status: 'success',
      data: { publicShareUrl, shareCount: updated.shareCount },
    });
  } catch (err) {
    console.error('Share card error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// GET /api/share/card/:shareId - Public card view
router.get('/share/card/:shareId', async (req, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;

    const card = await StoryCard.findOne({ publicShareUrl: shareId }).lean();
    if (!card) {
      res.status(404).json({ status: 'error', message: 'Shared card not found' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        card: {
          imageUrl: card.imageUrl,
          title: card.title,
          description: card.description,
          rarity: card.rarity,
          category: card.category,
          shareCount: card.shareCount,
        },
      },
    });
  } catch (err) {
    console.error('Public card error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
