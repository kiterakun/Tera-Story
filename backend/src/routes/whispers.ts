import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Playthrough, type IPlaythroughDocument } from '../models/Playthrough';
import { WhispersCache } from '../models/WhispersCache';
import { generateWhispers } from '../agents/supportAgent';
import { createUserProviderRegistry } from '../providers/registry';
import { UserSettings } from '../models/UserSettings';

const router = Router({ mergeParams: true });

// --- Helpers ---

async function verifyOwnership(
  playthroughId: string,
  userId: string,
  res: Response
): Promise<IPlaythroughDocument | null> {
  const playthrough = await Playthrough.findById(playthroughId);
  if (!playthrough) {
    res.status(404).json({ status: 'error', message: 'Playthrough not found' });
    return null;
  }
  if (playthrough.userId.toString() !== userId) {
    res.status(403).json({ status: 'error', message: 'Access denied' });
    return null;
  }
  return playthrough;
}

// --- Routes ---

// GET /api/playthroughs/:playthroughId/whispers
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;
    const forceRegenerate = req.query.forceRegenerate === 'true';

    const playthrough = await verifyOwnership(playthroughId as string, userId, res);
    if (!playthrough) return;

    const now = new Date();
    const hoursSinceActive =
      (now.getTime() - (playthrough.lastActiveAt?.getTime() ?? now.getTime())) /
      (1000 * 60 * 60);

    // No whispers needed if active within 24 hours unless forced
    if (hoursSinceActive < 24 && !forceRegenerate) {
      res.json({
        status: 'success',
        data: {
          playthroughId,
          whispers: [],
          daysAway: 0,
          hasNew: false,
        },
        message: 'User was active recently, no whispers needed',
      });
      return;
    }

    // Check cache
    if (!forceRegenerate) {
      const cached = await WhispersCache.findOne({ playthroughId }).lean();
      if (cached && cached.expiresAt > now) {
        res.json({
          status: 'success',
          data: {
            playthroughId,
            whispers: cached.whispers,
            daysAway: Math.floor(hoursSinceActive / 24),
            generatedAt: cached.generatedAt,
            hasNew: !cached.viewedAt,
          },
        });
        return;
      }
    }

    const daysAway = Math.floor(hoursSinceActive / 24);

    // forceRegenerate=true skips cache but does NOT trigger generation.
    // Return needsGeneration so client can request fresh after.
    if (forceRegenerate) {
      res.json({
        status: 'success',
        data: {
          playthroughId,
          whispers: [],
          daysAway,
          hasNew: false,
          needsGeneration: true,
        },
      });
      return;
    }

    try {
      // Generate whispers via supportAgent
      const settings = await UserSettings.findOne({ userId }).lean();
      if (!settings?.aiSettings) {
        // No AI settings configured — return empty
        res.json({
          status: 'success',
          data: {
            playthroughId,
            whispers: [],
            daysAway,
            hasNew: false,
          },
          message: 'AI settings not configured',
        });
        return;
      }

      const registry = createUserProviderRegistry(settings.aiSettings);
      const model = registry.getSupportModel();

      // Build context from available playthrough data
      const playthroughContext = JSON.stringify({
        name: playthrough.name,
        status: playthrough.status,
        currentArcIndex: playthrough.currentArcIndex,
        lastActiveAt: playthrough.lastActiveAt,
      });

      const whisperResult = await generateWhispers(
        playthroughContext,
        daysAway,
        model,
        settings.language ?? 'en'
      );

      // Cache result (7-day TTL)
      await WhispersCache.findOneAndUpdate(
        { playthroughId },
        {
          playthroughId,
          whispers: whisperResult.whispers,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        { upsert: true, returnDocument: 'after' }
      );

      res.json({
        status: 'success',
        data: {
          playthroughId,
          whispers: whisperResult.whispers,
          daysAway,
          generatedAt: new Date(),
          hasNew: true,
        },
      });
    } catch (genErr) {
      console.error('Generate whispers failed, returning needsGeneration:', genErr);
      res.json({
        status: 'success',
        data: {
          playthroughId,
          whispers: [],
          daysAway,
          hasNew: false,
          needsGeneration: true,
        },
        message: 'Whispers need AI generation — pending integration',
      });
    }
  } catch (err) {
    console.error('Get whispers error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/playthroughs/:playthroughId/whispers/mark-viewed
router.post('/mark-viewed', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    const playthrough = await verifyOwnership(playthroughId as string, userId, res);
    if (!playthrough) return;

    // Update cache viewedAt
    await WhispersCache.findOneAndUpdate(
      { playthroughId },
      { $set: { viewedAt: new Date() } }
    );

    // Update playthrough
    playthrough.lastWhispersViewedAt = new Date();
    await playthrough.save();

    res.json({
      status: 'success',
      message: 'Whispers marked as viewed',
    });
  } catch (err) {
    console.error('Mark whispers viewed error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// POST /api/playthroughs/:playthroughId/activity
router.post('/activity', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId } = req.params;

    const playthrough = await verifyOwnership(playthroughId as string, userId, res);
    if (!playthrough) return;

    playthrough.lastActiveAt = new Date();
    await playthrough.save();

    res.json({
      status: 'success',
      data: {
        lastActiveAt: playthrough.lastActiveAt,
      },
    });
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

export default router;
