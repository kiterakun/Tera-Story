import { Router, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Playthrough } from '../models/Playthrough';
import { World } from '../models/World';
import { generateChronicleCache } from '../services/chronicleService';
import { checkAchievements } from '../services/achievementService';
import { addLocation } from '../agents/mapAgent';
import { Region } from '../models/Region';
import { UserSettings } from '../models/UserSettings';
import { createUserProviderRegistry } from '../providers/registry';
import { extractJson } from '../utils/jsonExtractor';
import { streamText } from 'ai';

const router = Router({ mergeParams: true });

// --- Validation Schemas ---

const createPlaythroughSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  spawnRegionId: z.string().optional(),
  premise: z.string().optional(),
});

const updatePlaythroughSchema = z.object({
  name: z.string().min(1).trim().optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
});

// --- Nested Routes (under /api/worlds/:worldId/playthroughs) ---

// GET /api/worlds/:worldId/playthroughs
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { worldId } = req.params;

    // Verify world exists and belongs to user
    const world = await World.findById(worldId).lean();

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    if (world.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const filter = { worldId, userId };

    const [playthroughs, total] = await Promise.all([
      Playthrough.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Playthrough.countDocuments(filter),
    ]);

    res.json({ playthroughs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List playthroughs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/worlds/:worldId/playthroughs
router.post('/', validate(createPlaythroughSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { worldId } = req.params;

    // Verify world exists and belongs to user
    const world = await World.findById(worldId).lean();

    if (!world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }

    if (world.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    let playthrough = await Playthrough.create({
      name: req.body.name,
      worldId,
      userId,
      premise: req.body.premise || '',
    });
    let spawnLocation: Awaited<ReturnType<typeof addLocation>> | undefined;

    if (req.body.spawnRegionId) {
      let name = 'Starting Point';
      let description = 'Where the journey begins.';
      let type: 'town' | 'dungeon' | 'wilderness' | 'ruin' | 'sanctuary' | 'crossroad' = 'crossroad';

      const region = await Region.findById(req.body.spawnRegionId).lean();
      const world = await World.findById(worldId).lean();
      const premise = req.body.premise || '';

      if (region && world) {
        try {
          const settings = await UserSettings.findOne({ userId }).lean();
          if (settings) {
            const registry = createUserProviderRegistry(settings.aiSettings);
            const model = registry.getSupportModel();
            const userLanguage = settings.language === 'vi' ? 'Vietnamese' : 'English';

            const systemPrompt = `You are a world-building map agent for an interactive storytelling game.
Your task is to generate a starting location within a specific region of a world.
The location must fit the world's description, genre, the specific region's theme/terrain, and optionally align with the playthrough's premise/starting hooks.

CRITICAL: You must generate all text (name, description) in the requested user language: ${userLanguage}.

Respond ONLY with a JSON object in this format:
{
  "name": "A beautiful, evocative name for the starting location (in ${userLanguage})",
  "description": "An atmospheric, detailed 1-2 sentence description of the location, where the protagonist starts their journey (in ${userLanguage}).",
  "type": "Must be exactly one of: 'town', 'dungeon', 'wilderness', 'ruin', 'sanctuary', 'crossroad'"
}`;

            const userPrompt = `World Genre: ${world.genre}
World Description: ${world.description}
Region Name: ${region.name}
Region Theme/Terrain: ${region.terrainType || ''} - ${region.description || ''}
Playthrough Premise: ${premise}

Generate the starting location JSON.`;

            const result = streamText({
              model,
              system: systemPrompt,
              prompt: userPrompt,
              temperature: 0.7,
            });

            const text = await result.text;
            const generated = extractJson<{ name: string; description: string; type: string }>(text);

            if (generated && generated.name && generated.description) {
              name = generated.name;
              description = generated.description;
              if (['town', 'dungeon', 'wilderness', 'ruin', 'sanctuary', 'crossroad'].includes(generated.type)) {
                type = generated.type as typeof type;
              }
            }
          }
        } catch (err) {
          console.error('[StartingLocation] Generation failed, using default:', err);
        }
      }

      spawnLocation = await addLocation({
        regionId: req.body.spawnRegionId,
        playthroughId: playthrough._id.toString(),
        name,
        description,
        type,
      });

      const updatedPlaythrough = await Playthrough.findByIdAndUpdate(
        playthrough._id,
        { $set: { currentLocationId: spawnLocation._id } },
        { returnDocument: 'after' }
      );
      if (updatedPlaythrough) {
        playthrough = updatedPlaythrough;
      }
    }

    res.status(201).json({ playthrough, ...(spawnLocation ? { spawnLocation } : {}) });
  } catch (err) {
    console.error('Create playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Standalone Routes (under /api/playthroughs) ---

// GET /api/playthroughs/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const playthrough = await Playthrough.findById(id).lean().populate('worldId', 'name');

    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    if (playthrough.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ playthrough });
  } catch (err) {
    console.error('Get playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/playthroughs/:id
router.put('/:id', validate(updatePlaythroughSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const playthrough = await Playthrough.findById(id).lean();

    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    if (playthrough.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await Playthrough.findByIdAndUpdate(
      id,
      { $set: req.body },
      { returnDocument: 'after' }
    );

    // Trigger chronicle generation + achievement check on completion
    if (req.body.status === 'completed') {
      try {
        await generateChronicleCache(id as string);
        await Playthrough.findByIdAndUpdate(id, {
          $set: { completedAt: new Date() },
        });
        // Check achievements for playthrough completion
        checkAchievements(userId, {
          type: 'playthrough_completed',
          data: { playthroughId: id },
        });
      } catch (err) {
        console.error('Failed to generate chronicle:', err);
      }
    }

    res.json({ playthrough: updated });
  } catch (err) {
    console.error('Update playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/playthroughs/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const playthrough = await Playthrough.findById(id).lean();

    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    if (playthrough.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Cascade delete related models (Arc, Chapter, Character) if they exist
    try {
      const Arc = mongoose.models.Arc || mongoose.model('Arc');
      await Arc.deleteMany({ playthroughId: id });
    } catch {
      // Arc model not yet defined, skip
    }

    try {
      const Chapter = mongoose.models.Chapter || mongoose.model('Chapter');
      await Chapter.deleteMany({ playthroughId: id });
    } catch {
      // Chapter model not yet defined, skip
    }

    try {
      const Character = mongoose.models.Character || mongoose.model('Character');
      await Character.deleteMany({ playthroughId: id });
    } catch {
      // Character model not yet defined, skip
    }

    try {
      const Location = mongoose.models.Location || mongoose.model('Location');
      await Location.deleteMany({ playthroughId: id });
    } catch {
      // Location model not yet defined, skip
    }

    await Playthrough.findByIdAndDelete(id);

    res.json({ message: 'Playthrough deleted successfully' });
  } catch (err) {
    console.error('Delete playthrough error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
