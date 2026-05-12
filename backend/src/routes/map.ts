import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Continent } from '../models/Continent';
import { Region } from '../models/Region';
import { Location } from '../models/Location';
import { World } from '../models/World';
import { createUserProviderRegistry } from '../providers/registry';
import { UserSettings } from '../models/UserSettings';

const router = Router();

router.get('/:worldId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { worldId } = req.params;

  const continents = await Continent.find({ worldId }).lean();
  const continentsWithRegions = await Promise.all(
    continents.map(async (continent) => {
      const regions = await Region.find({ continentId: continent._id }).lean();
      return { ...continent, regions };
    })
  );

  res.json({ status: 'success', data: { continents: continentsWithRegions } });
});

router.get('/continent/:continentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { continentId } = req.params;

  const continent = await Continent.findById(continentId).lean();
  const regions = await Region.find({ continentId }).lean();

  res.json({ status: 'success', data: { continent, regions } });
});

router.get('/region/:regionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { regionId } = req.params;
  const { playthroughId } = req.query;

  const region = await Region.findById(regionId).lean();
  const locations = await Location.find({ regionId, playthroughId }).lean();

  res.json({ status: 'success', data: { region, locations } });
});

router.get('/travel-options/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { locationId } = req.params;
  const { playthroughId } = req.query;

  const currentLocation = await Location.findById(locationId).lean();
  const connectedLocations = currentLocation?.connectedLocations ?? [];
  const destinations = await Location.find({
    _id: { $in: connectedLocations },
    playthroughId,
  }).lean();

  res.json({ status: 'success', data: { currentLocation, destinations } });
});

const generateMapSchema = z.object({
  modelProvider: z.enum(['writer', 'context', 'support']).default('writer'),
});

router.post('/:worldId/generate', authMiddleware, validate(generateMapSchema), async (req: AuthRequest, res: Response) => {
  const worldId = req.params.worldId;
  if (typeof worldId !== 'string') {
    res.status(400).json({ status: 'error', message: 'worldId is required' });
    return;
  }

  const { modelProvider } = req.body as z.infer<typeof generateMapSchema>;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'Authentication required' });
    return;
  }

  const world = await World.findById(worldId).lean();
  if (!world) {
    res.status(404).json({ status: 'error', message: 'World not found' });
    return;
  }

  const settings = await UserSettings.findOne({ userId }).lean();
  if (!settings?.aiSettings) {
    res.status(400).json({ status: 'error', message: 'AI settings not configured' });
    return;
  }

  const registry = createUserProviderRegistry(settings.aiSettings);
  const model = modelProvider === 'context'
    ? registry.getContextModel()
    : modelProvider === 'support'
      ? registry.getSupportModel()
      : registry.getWriterModel();

  const { generateWorldMap } = await import('../agents/mapAgent');
  const result = await generateWorldMap({
    worldId,
    worldDescription: world.description,
    genre: world.genre,
    model,
  });

  res.json({ status: 'success', data: result });
});

export default router;
