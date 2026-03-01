import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserSettings } from '../models/UserSettings';
import { World } from '../models/World';
import { Playthrough } from '../models/Playthrough';
import { Chapter } from '../models/Chapter';
import { createUserProviderRegistry } from '../providers/registry';
import { enrichWorld, enrichCharacter, enrichChoices } from '../agents/supportAgent';

const router = Router();

// POST /api/support/enrich-world
router.post('/enrich-world', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { description, language } = req.body as { description?: string; language?: string };

    if (!description) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const settings = await UserSettings.findOne({ userId });
    if (!settings) {
      res.status(404).json({ error: 'User settings not found. Please configure AI settings first.' });
      return;
    }

    const registry = createUserProviderRegistry(settings.aiSettings);
    const model = registry.getSupportModel();
    const lang = language || settings.language || 'en';

    const result = await enrichWorld(description, model, lang);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Enrich world error:', err);
    res.status(500).json({ error: 'Failed to enrich world' });
  }
});

// POST /api/support/enrich-character
router.post('/enrich-character', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { description, worldId, language } = req.body as {
      description?: string;
      worldId?: string;
      language?: string;
    };

    if (!description) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const settings = await UserSettings.findOne({ userId });
    if (!settings) {
      res.status(404).json({ error: 'User settings not found. Please configure AI settings first.' });
      return;
    }

    // Build world context if worldId provided
    let worldContext = '';
    if (worldId) {
      const world = await World.findById(worldId);
      if (world) {
        worldContext = `World: ${world.name}\nGenre: ${world.genre}\nDescription: ${world.description}`;
        if (world.resourceTemplates.length > 0) {
          const stats = world.resourceTemplates.map((t) => `${t.key} (${t.type})`).join(', ');
          worldContext += `\nResource Templates: ${stats}`;
        }
      }
    }

    const registry = createUserProviderRegistry(settings.aiSettings);
    const model = registry.getSupportModel();
    const lang = language || settings.language || 'en';

    const result = await enrichCharacter(description, worldContext, model, lang);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Enrich character error:', err);
    res.status(500).json({ error: 'Failed to enrich character' });
  }
});

// POST /api/support/enrich-choices
router.post('/enrich-choices', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId, language } = req.body as {
      playthroughId?: string;
      language?: string;
    };

    if (!playthroughId) {
      res.status(400).json({ error: 'playthroughId is required' });
      return;
    }

    const settings = await UserSettings.findOne({ userId });
    if (!settings) {
      res.status(404).json({ error: 'User settings not found. Please configure AI settings first.' });
      return;
    }

    // Build story context from recent chapters
    const playthrough = await Playthrough.findOne({ _id: playthroughId, userId });
    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    const recentChapters = await Chapter.find({ playthroughId })
      .sort({ chapterIndex: -1 })
      .limit(3)
      .lean();

    const context = recentChapters
      .reverse()
      .map((ch) => ch.content)
      .join('\n\n---\n\n');

    if (!context) {
      res.status(400).json({ error: 'No chapters found — cannot suggest choices without story context' });
      return;
    }

    const registry = createUserProviderRegistry(settings.aiSettings);
    const model = registry.getSupportModel();
    const lang = language || settings.language || 'en';

    const choices = await enrichChoices(context, model, lang);
    res.json({ success: true, data: { choices } });
  } catch (err) {
    console.error('Enrich choices error:', err);
    res.status(500).json({ error: 'Failed to enrich choices' });
  }
});

export default router;
