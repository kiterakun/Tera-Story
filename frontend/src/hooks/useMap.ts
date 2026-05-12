import { useState, useCallback } from 'react';
import * as mapApi from '../services/mapApi';
import type { Continent, Region, Location } from '../services/mapApi';

type ZoomLevel = 1 | 2 | 3;

export function useMap() {
  const [continents, setContinents] = useState<Continent[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>(1);
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMap = useCallback(async (worldId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mapApi.getWorldMap(worldId);
      setContinents(data.continents);
      setCurrentZoom(1);
      setSelectedContinent(null);
      setSelectedRegion(null);
      setSelectedLocation(null);
      setRegions([]);
      setLocations([]);
    } catch {
      setError('Failed to load world map');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const zoomToContinent = useCallback(async (worldId: string, continentId: string) => {
    const continent = continents.find(c => c._id === continentId);
    if (!continent) return;
    setSelectedContinent(continent);
    setIsLoading(true);
    setError(null);
    try {
      const data = await mapApi.getContinent(worldId, continentId);
      setRegions(data.regions);
      setCurrentZoom(2);
      setSelectedRegion(null);
      setSelectedLocation(null);
      setLocations([]);
    } catch {
      setError('Failed to load continent regions');
    } finally {
      setIsLoading(false);
    }
  }, [continents]);

  const zoomToRegion = useCallback(async (worldId: string, regionId: string, playthroughId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mapApi.getRegion(worldId, regionId, playthroughId);
      setSelectedRegion(data.region);
      setLocations(data.locations);
      setCurrentZoom(3);
      setSelectedLocation(null);
    } catch {
      setError('Failed to load region locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectLocation = useCallback((location: Location | null) => {
    setSelectedLocation(location);
  }, []);

  const travel = useCallback(async (worldId: string, locationId: string, playthroughId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mapApi.getTravelOptions(worldId, locationId, playthroughId);
      setSelectedLocation(data.currentLocation);
      return data;
    } catch {
      setError('Failed to load travel options');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (currentZoom === 3) {
      setCurrentZoom(2);
      setSelectedRegion(null);
      setSelectedLocation(null);
      setLocations([]);
    } else if (currentZoom === 2) {
      setCurrentZoom(1);
      setSelectedContinent(null);
      setSelectedRegion(null);
      setSelectedLocation(null);
      setRegions([]);
      setLocations([]);
    }
  }, [currentZoom]);

  const resetView = useCallback(() => {
    setCurrentZoom(1);
    setSelectedContinent(null);
    setSelectedRegion(null);
    setSelectedLocation(null);
    setRegions([]);
    setLocations([]);
  }, []);

  return {
    continents,
    regions,
    locations,
    currentZoom,
    selectedContinent,
    selectedRegion,
    selectedLocation,
    isLoading,
    error,
    fetchMap,
    zoomToContinent,
    zoomToRegion,
    selectLocation,
    travel,
    zoomOut,
    resetView,
  };
}
