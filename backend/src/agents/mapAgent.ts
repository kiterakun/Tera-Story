import { streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { extractJson } from '../utils/jsonExtractor';
import { Continent, type IContinentDocument } from '../models/Continent';
import { Region, type IRegionDocument } from '../models/Region';
import { Location, type ILocationDocument } from '../models/Location';
import { emit } from '../services/sseManager';
import { renderPrompt } from './prompts/renderPrompt';

export interface MapAgentParams {
  worldId: string;
  worldDescription: string;
  genre: string;
  model: LanguageModel;
}

interface LLMRegionOutput {
  name: string;
  description: string;
  terrainType: string;
  position: { x: number; y: number };
}

interface LLMContinentOutput {
  name: string;
  description: string;
  terrainType: string;
  climate: string;
  dominantCulture: string;
  position: { x: number; y: number };
  regions: LLMRegionOutput[];
}

interface WorldMapOutput {
  continents: LLMContinentOutput[];
}

export async function generateWorldMap(
  params: MapAgentParams
): Promise<{ continents: IContinentDocument[]; regions: IRegionDocument[] }> {
  const { worldId, worldDescription, genre, model } = params;

  const userPrompt = `World Description: ${worldDescription}\nGenre: ${genre}\n\nGenerate a world map with continents and regions that fit this world.`;

  const result = streamText({
    model,
    system: renderPrompt('map.prompt.md'),
    prompt: userPrompt,
    temperature: 0.7,
  });

  const text = await result.text;
  const mapData = extractJson<WorldMapOutput>(text);

  if (!mapData?.continents || !Array.isArray(mapData.continents)) {
    throw new Error('Invalid map data structure: missing continents array');
  }

  const createdContinents: IContinentDocument[] = [];
  const createdRegions: IRegionDocument[] = [];

  for (const contData of mapData.continents) {
    const continent = await Continent.create({
      worldId,
      name: contData.name,
      description: contData.description,
      terrainType: contData.terrainType,
      climate: contData.climate,
      dominantCulture: contData.dominantCulture,
      position: contData.position,
    });

    createdContinents.push(continent);

    if (contData.regions && Array.isArray(contData.regions)) {
      const regionIds: string[] = [];

      for (const regData of contData.regions) {
        const region = await Region.create({
          continentId: continent._id,
          name: regData.name,
          description: regData.description,
          terrainType: regData.terrainType,
          position: regData.position,
        });

        createdRegions.push(region);
        regionIds.push(region._id.toString());
      }

      await Continent.findByIdAndUpdate(
        continent._id,
        { $push: { regions: { $each: regionIds } } },
        { returnDocument: 'after' }
      );
    }
  }

  return { continents: createdContinents, regions: createdRegions };
}

export interface AddLocationParams {
  regionId: string;
  playthroughId: string;
  name: string;
  description: string;
  type: 'town' | 'dungeon' | 'wilderness' | 'ruin' | 'sanctuary' | 'crossroad';
  connectedTo?: string;
  dynamicStats?: Array<{ k: string; v: string | number | boolean; t: string; maxV?: number }>;
}

export async function addLocation(
  params: AddLocationParams
): Promise<ILocationDocument> {
  const { regionId, playthroughId, name, description, type, connectedTo, dynamicStats } = params;

  const region = await Region.findById(regionId).lean();
  if (!region) {
    throw new Error(`Region not found: ${regionId}`);
  }

  const centerX = region.position?.x ?? 500;
  const centerY = region.position?.y ?? 500;
  const offsetX = Math.floor(Math.random() * 100) - 50;
  const offsetY = Math.floor(Math.random() * 100) - 50;

  const position = {
    x: Math.max(0, Math.min(1000, centerX + offsetX)),
    y: Math.max(0, Math.min(1000, centerY + offsetY)),
  };

  const connectedLocations: string[] = [];
  if (connectedTo) {
    connectedLocations.push(connectedTo);
  }

  const location = await Location.create({
    regionId,
    playthroughId,
    name,
    description,
    type,
    position,
    discoveredAt: Date.now(),
    status: 'known',
    connectedLocations,
    dynamicStats: dynamicStats || [],
  });

  if (connectedTo) {
    await Location.findByIdAndUpdate(
      connectedTo,
      { $addToSet: { connectedLocations: location._id } },
      { returnDocument: 'after' }
    );
  }

  emit(playthroughId, 'location:discovered', {
    location: location.toObject(),
    regionId,
  });

  return location;
}