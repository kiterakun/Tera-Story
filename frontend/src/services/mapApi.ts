import { api } from './api';

export interface MapPosition { x: number; y: number; }

export interface Continent {
  _id: string;
  worldId: string;
  name: string;
  description: string;
  terrainType: string;
  climate: string;
  dominantCulture: string;
  position: MapPosition;
  regions: Region[];
  imageUrl?: string;
}

export interface Region {
  _id: string;
  continentId: string;
  name: string;
  description: string;
  terrainType: string;
  position: MapPosition;
  neighborRegions: string[];
  locations: Location[];
  dangerLevel: number;
  resources: string[];
}

export interface Location {
  _id: string;
  regionId: string;
  playthroughId: string;
  name: string;
  description: string;
  type: 'town' | 'dungeon' | 'wilderness' | 'ruin' | 'sanctuary' | 'crossroad';
  position: MapPosition;
  discoveredAt: number;
  status: string;
  connectedLocations: string[];
}

export interface MapData {
  continents: Continent[];
  regions?: Region[];
}

export interface LocationWithContext extends Location {
  region: Region | null;
}

export interface CurrentLocationContext {
  currentLocation: Location | null;
  region: Region | null;
  continent: Continent | null;
  connectedLocations: Location[];
}

export async function getWorldMap(worldId: string): Promise<MapData> {
  const res = await api.get<{ status: string; data: MapData }>(`/map/${worldId}`);
  return res.data.data;
}

export async function getContinent(worldId: string, continentId: string): Promise<{ continent: Continent; regions: Region[] }> {
  const res = await api.get<{ status: string; data: { continent: Continent; regions: Region[] } }>(`/map/continent/${continentId}`);
  return res.data.data;
}

export async function getRegion(worldId: string, regionId: string, playthroughId: string): Promise<{ region: Region; locations: Location[] }> {
  const res = await api.get<{ status: string; data: { region: Region; locations: Location[] } }>(`/map/region/${regionId}`, { params: { playthroughId } });
  return res.data.data;
}

export async function getTravelOptions(worldId: string, locationId: string, playthroughId: string): Promise<{ currentLocation: Location; destinations: Location[] }> {
  const res = await api.get<{ status: string; data: { currentLocation: Location; destinations: Location[] } }>(`/map/travel-options/${locationId}`, { params: { playthroughId } });
  return res.data.data;
}

export async function getPlaythroughLocations(playthroughId: string): Promise<{ locations: LocationWithContext[] }> {
  const res = await api.get<{ status: string; data: { locations: LocationWithContext[] } }>(`/map/playthrough/${playthroughId}/locations`);
  return res.data.data;
}

export async function getCurrentLocationContext(playthroughId: string): Promise<CurrentLocationContext> {
  const res = await api.get<{ status: string; data: CurrentLocationContext }>(`/map/playthrough/${playthroughId}/current`);
  return res.data.data;
}
