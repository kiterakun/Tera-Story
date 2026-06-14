import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Continent } from '../models/Continent';
import { Region } from '../models/Region';
import { Location } from '../models/Location';
import { World } from '../models/World';
import { Playthrough } from '../models/Playthrough';
import { createUserProviderRegistry } from '../providers/registry';
import { UserSettings } from '../models/UserSettings';

const router = Router();

function getUserId(req: AuthRequest, res: Response): string | null {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'Authentication required' });
    return null;
  }
  return userId;
}

function notFound(res: Response, message = 'Resource not found'): void {
  res.status(404).json({ status: 'error', message });
}

function getParam(req: AuthRequest, res: Response, name: string): string | null {
  const value = req.params[name];
  if (typeof value !== 'string') {
    res.status(400).json({ status: 'error', message: `${name} is required` });
    return null;
  }
  return value;
}

async function userOwnsWorld(worldId: mongoose.Types.ObjectId | string, userId: string): Promise<boolean> {
  const world = await World.exists({ _id: worldId, userId });
  return Boolean(world);
}

async function userOwnsContinent(continentId: mongoose.Types.ObjectId | string, userId: string): Promise<boolean> {
  const continent = await Continent.findById(continentId).select('worldId').lean();
  return Boolean(continent && await userOwnsWorld(continent.worldId, userId));
}

async function userOwnsRegion(regionId: mongoose.Types.ObjectId | string, userId: string): Promise<boolean> {
  const region = await Region.findById(regionId).select('continentId').lean();
  return Boolean(region && await userOwnsContinent(region.continentId, userId));
}

async function userOwnsPlaythrough(playthroughId: mongoose.Types.ObjectId | string, userId: string): Promise<boolean> {
  const playthrough = await Playthrough.exists({ _id: playthroughId, userId });
  return Boolean(playthrough);
}

async function userCanAccessLocation(locationId: mongoose.Types.ObjectId | string, userId: string): Promise<boolean> {
  const location = await Location.findById(locationId).select('regionId playthroughId').lean();
  if (!location) return false;
  if (location.playthroughId) {
    return userOwnsPlaythrough(location.playthroughId, userId);
  }
  return userOwnsRegion(location.regionId, userId);
}

router.get('/:worldId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;
  const worldId = getParam(req, res, 'worldId');
  if (!worldId) return;

  const world = await World.findOne({ _id: worldId, userId }).select('_id').lean();
  if (!world) {
    notFound(res, 'World not found');
    return;
  }

  const continents = await Continent.find({ worldId: world._id }).lean();
  const continentsWithRegions = await Promise.all(
    continents.map(async (continent) => {
      const regions = await Region.find({ continentId: continent._id }).lean();
      return { ...continent, regions };
    })
  );

  res.json({ status: 'success', data: { continents: continentsWithRegions } });
});

router.get('/continent/:continentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;
  const continentId = getParam(req, res, 'continentId');
  if (!continentId) return;

  const continent = await Continent.findById(continentId).lean();
  if (!continent || !await userOwnsWorld(continent.worldId, userId)) {
    notFound(res, 'Continent not found');
    return;
  }
  const regions = await Region.find({ continentId }).lean();

  res.json({ status: 'success', data: { continent, regions } });
});

router.get('/region/:regionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;
  const regionId = getParam(req, res, 'regionId');
  if (!regionId) return;
  const { playthroughId } = req.query;

  const region = await Region.findById(regionId).lean();
  if (!region || !await userOwnsContinent(region.continentId, userId)) {
    notFound(res, 'Region not found');
    return;
  }
  if (typeof playthroughId === 'string' && playthroughId !== 'current' && !await userOwnsPlaythrough(playthroughId, userId)) {
    notFound(res, 'Playthrough not found');
    return;
  }
  const query = {
    regionId,
    $or: playthroughId && playthroughId !== 'current'
      ? [
          { playthroughId: { $exists: false } },
          { playthroughId: null },
          { playthroughId }
        ]
      : [
          { playthroughId: { $exists: false } },
          { playthroughId: null }
        ]
  };

  const locations = await Location.find(query).lean();

  res.json({ status: 'success', data: { region, locations } });
});

router.get('/travel-options/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;
  const locationId = getParam(req, res, 'locationId');
  if (!locationId) return;
  const { playthroughId } = req.query;

  const currentLocation = await Location.findById(locationId).lean();
  if (!currentLocation || !await userCanAccessLocation(locationId, userId)) {
    notFound(res, 'Location not found');
    return;
  }
  if (typeof playthroughId === 'string' && playthroughId !== 'current' && !await userOwnsPlaythrough(playthroughId, userId)) {
    notFound(res, 'Playthrough not found');
    return;
  }
  const connectedLocations = currentLocation.connectedLocations ?? [];
  const query = {
    _id: { $in: connectedLocations },
    $or: playthroughId && playthroughId !== 'current'
      ? [
          { playthroughId: { $exists: false } },
          { playthroughId: null },
          { playthroughId }
        ]
      : [
          { playthroughId: { $exists: false } },
          { playthroughId: null }
        ]
  };

  const destinations = await Location.find(query).lean();

  res.json({ status: 'success', data: { currentLocation, destinations } });
});

// ── Playthrough-specific endpoints ─────────────────────────────────────

router.get('/playthrough/:playthroughId/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;
  const playthroughId = getParam(req, res, 'playthroughId');
  if (!playthroughId) return;

  const playthrough = await Playthrough.findOne({ _id: playthroughId, userId }).select('_id').lean();
  if (!playthrough) {
    notFound(res, 'Playthrough not found');
    return;
  }

  const locations = await Location.find({ playthroughId }).lean();

  // Group by region for structured display
  const regionIds = [...new Set(locations.map(l => l.regionId.toString()))];
  const regions = await Region.find({ _id: { $in: regionIds } }).lean();
  const regionMap = new Map(regions.map(r => [r._id.toString(), r]));

  const locationsWithRegions = locations.map(loc => ({
    ...loc,
    region: regionMap.get(loc.regionId.toString()) || null,
  }));

  res.json({ status: 'success', data: { locations: locationsWithRegions } });
});

router.get('/playthrough/:playthroughId/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req, res);
  if (!userId) return;
  const playthroughId = getParam(req, res, 'playthroughId');
  if (!playthroughId) return;

  const playthrough = await Playthrough.findOne({ _id: playthroughId, userId }).lean();
  if (!playthrough) {
    res.status(404).json({ status: 'error', message: 'Playthrough not found' });
    return;
  }

  if (!playthrough.currentLocationId) {
    res.json({ status: 'success', data: { currentLocation: null, region: null, continent: null, connectedLocations: [] } });
    return;
  }

  const currentLocation = await Location.findById(playthrough.currentLocationId).lean();
  if (!currentLocation) {
    res.json({ status: 'success', data: { currentLocation: null, region: null, continent: null, connectedLocations: [] } });
    return;
  }

  const region = await Region.findById(currentLocation.regionId).lean();
  const continent = region ? await Continent.findById(region.continentId).lean() : null;

  // Get connected locations
  const connectedIds = currentLocation.connectedLocations || [];
  const connectedLocations = await Location.find({ _id: { $in: connectedIds } }).lean();

  res.json({
    status: 'success',
    data: {
      currentLocation,
      region,
      continent,
      connectedLocations,
    },
  });
});

const generateMapSchema = z.object({
  modelProvider: z.enum(['writer', 'context', 'support']).default('writer'),
});

router.post('/:worldId/generate', authMiddleware, validate(generateMapSchema), async (req: AuthRequest, res: Response) => {
  const worldId = getParam(req, res, 'worldId');
  if (!worldId) return;

  const { modelProvider } = req.body as z.infer<typeof generateMapSchema>;
  const userId = getUserId(req, res);
  if (!userId) return;

  const world = await World.findOne({ _id: worldId, userId }).lean();
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
