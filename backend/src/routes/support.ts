import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UserSettings } from '../models/UserSettings';
import { World } from '../models/World';
import { Playthrough } from '../models/Playthrough';
import { Chapter } from '../models/Chapter';
import { createUserProviderRegistry } from '../providers/registry';
import { enrichWorld, enrichCharacter, enrichChoices, enrichCustomChoice } from '../agents/supportAgent';
import { logger } from '../utils/logger';

const router = Router();

const objectId = z.string().refine((s) => mongoose.Types.ObjectId.isValid(s), {
  message: 'Invalid id',
});
const nonEmptyString = z.string().min(1).max(10000);
const optionalLanguage = z.string().min(2).max(8).optional();

const enrichWorldSchema = z.object({
  description: nonEmptyString,
  language: optionalLanguage,
});

const enrichCharacterSchema = z.object({
  description: nonEmptyString,
  worldId: objectId.optional(),
  language: optionalLanguage,
});

const enrichChoicesSchema = z.object({
  playthroughId: objectId,
  language: optionalLanguage,
});

const enrichCustomChoiceSchema = z.object({
  playthroughId: objectId,
  customChoice: nonEmptyString,
  language: optionalLanguage,
});

// POST /api/support/enrich-world
router.post('/enrich-world', validate(enrichWorldSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { description, language } = req.body as z.infer<typeof enrichWorldSchema>;

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
    logger.error({ err }, 'Enrich world error:');
    res.status(500).json({ error: 'Failed to enrich world' });
  }
});

// POST /api/support/enrich-character
router.post('/enrich-character', validate(enrichCharacterSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { description, worldId, language } = req.body as z.infer<typeof enrichCharacterSchema>;

    const settings = await UserSettings.findOne({ userId });
    if (!settings) {
      res.status(404).json({ error: 'User settings not found. Please configure AI settings first.' });
      return;
    }

    // Build world context if worldId provided
    let worldContext = '';
    if (worldId && mongoose.Types.ObjectId.isValid(worldId)) {
      const world = await World.findById(worldId);
      if (world) {
        worldContext = `World: ${world.name}\nGenre: ${world.genre}\nDescription: ${world.description}`;
        if (world.resourceTemplates.length > 0) {
          const stats = world.resourceTemplates.map((t) => `${t.key} (${t.type}${t.min !== undefined ? `, min:${t.min}` : ''}${t.max !== undefined ? `, max:${t.max}` : ''}${t.defaultValue !== undefined ? `, default:${t.defaultValue}` : ''})`).join(', ');
          worldContext += `\nResource Templates: ${stats}`;
        }
        // Query SpecialItemTemplate collection (extracted in Phase 2)
        const { SpecialItemTemplate } = await import('../models/SpecialItemTemplate');
        const sitDocs = await SpecialItemTemplate.find({ worldId: world._id }).lean();
        if (sitDocs.length > 0) {
          const sitInfo = sitDocs.map((sit: { category: string; description: string; fields?: { name: string; type: string }[] }) => {
            const fields = sit.fields?.map((f: { name: string; type: string }) => `${f.name}(${f.type})`).join(', ') || 'none';
            return `${sit.category}: ${sit.description} [fields: ${fields}]`;
          }).join('; ');
          worldContext += `\nSpecial Item Categories: ${sitInfo}`;
        }
      }
    }

    const registry = createUserProviderRegistry(settings.aiSettings);
    const model = registry.getSupportModel();
    const lang = language || settings.language || 'en';

    const result = await enrichCharacter(description, worldContext, model, lang);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err }, 'Enrich character error:');
    res.status(500).json({ error: 'Failed to enrich character' });
  }
});

// POST /api/support/enrich-choices
router.post('/enrich-choices', validate(enrichChoicesSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId, language } = req.body as z.infer<typeof enrichChoicesSchema>;

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
    logger.error({ err }, 'Enrich choices error:');
    res.status(500).json({ error: 'Failed to enrich choices' });
  }
});

// POST /api/support/enrich-custom-choice
router.post('/enrich-custom-choice', validate(enrichCustomChoiceSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playthroughId, customChoice, language } = req.body as z.infer<typeof enrichCustomChoiceSchema>;

    const settings = await UserSettings.findOne({ userId });
    if (!settings) {
      res.status(404).json({ error: 'User settings not found. Please configure AI settings first.' });
      return;
    }

    const playthrough = await Playthrough.findOne({ _id: playthroughId, userId });
    if (!playthrough) {
      res.status(404).json({ error: 'Playthrough not found' });
      return;
    }

    // Build story context from recent chapters
    const recentChapters = await Chapter.find({ playthroughId })
      .sort({ chapterIndex: -1 })
      .limit(3)
      .lean();

    const storyContext = recentChapters
      .reverse()
      .map((ch) => ch.content)
      .join('\n\n---\n\n');

    if (!storyContext) {
      res.status(400).json({ error: 'No chapters found — cannot evaluate choice without story context' });
      return;
    }

    // Build world context
    let worldContext = '';
    const world = await World.findById(playthrough.worldId);
    if (world) {
      worldContext = `World: ${world.name}\nGenre: ${world.genre}\nDescription: ${world.description}`;
    }

    const registry = createUserProviderRegistry(settings.aiSettings);
    const model = registry.getSupportModel();
    const lang = language || settings.language || 'en';

    const result = await enrichCustomChoice(customChoice, storyContext, worldContext, model, lang);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err }, 'Enrich custom choice error:');
    res.status(500).json({ error: 'Failed to enrich custom choice' });
  }
});

export default router;
