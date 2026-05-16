import { useState, useCallback } from 'react';
import * as mapApi from '../services/mapApi';
import type { Location, Region, Continent, LocationWithContext } from '../services/mapApi';

interface LocationWithFullContext {
  location: Location;
  region: Region | null;
  continent: Continent | null;
  connectedLocations: Location[];
}

export function useMap() {
  const [currentContext, setCurrentContext] = useState<LocationWithFullContext | null>(null);
  const [playthroughLocations, setPlaythroughLocations] = useState<LocationWithContext[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentLocation = useCallback(async (playthroughId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mapApi.getCurrentLocationContext(playthroughId);
      if (data.currentLocation) {
        setCurrentContext({
          location: data.currentLocation,
          region: data.region,
          continent: data.continent,
          connectedLocations: data.connectedLocations,
        });
      } else {
        setCurrentContext(null);
      }
    } catch {
      setError('Failed to load current location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllLocations = useCallback(async (playthroughId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mapApi.getPlaythroughLocations(playthroughId);
      setPlaythroughLocations(data.locations);
    } catch {
      setError('Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTravelOptions = useCallback(async (worldId: string, locationId: string, playthroughId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mapApi.getTravelOptions(worldId, locationId, playthroughId);
      return data;
    } catch {
      setError('Failed to load travel options');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectLocation = useCallback((location: Location | null) => {
    if (currentContext) {
      setCurrentContext({
        ...currentContext,
        location: location || currentContext.location,
      });
    }
  }, [currentContext]);

  return {
    currentContext,
    playthroughLocations,
    isLoading,
    error,
    fetchCurrentLocation,
    fetchAllLocations,
    fetchTravelOptions,
    selectLocation,
  };
}
