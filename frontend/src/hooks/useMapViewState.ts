import { useEffect, useMemo, useState } from 'react';
import { getWorldMap } from '../services/mapApi';
import type { Location, MapData } from '../services/mapApi';
import { useMap } from './useMap';
import { useStoryStore } from '../stores/storyStore';
import { useTranslation } from '../i18n';

export type MapViewMode = 'standard' | '3level';

export interface HierarchicalContinent {
  continentId: string;
  continentName: string;
  continentDescription: string;
  climate: string;
  terrainType: string;
  regions: Array<{
    regionId: string;
    regionName: string;
    dangerLevel: number;
    locations: Location[];
  }>;
}

interface UseMapViewStateParams {
  worldId?: string;
  playthroughId?: string;
}

export function useMapViewState({ worldId, playthroughId }: UseMapViewStateParams = {}) {
  const t = useTranslation();
  const world = useStoryStore((state) => state.world);
  const {
    currentContext,
    playthroughLocations,
    isLoading,
    error,
    fetchCurrentLocation,
    fetchAllLocations,
  } = useMap();

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(!!worldId);
  const [mapError, setMapError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('standard');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Initial playthrough fetch
  useEffect(() => {
    if (playthroughId) {
      fetchCurrentLocation(playthroughId);
      fetchAllLocations(playthroughId);
    }
  }, [playthroughId, fetchCurrentLocation, fetchAllLocations]);

  // Load world map in background for playthroughs
  useEffect(() => {
    if (playthroughId && world?._id) {
      getWorldMap(world._id)
        .then(setMapData)
        .catch((err) => console.error('Failed to prefetch world map:', err));
    }
  }, [playthroughId, world?._id]);

  // World detail map fetch
  useEffect(() => {
    if (worldId) {
      getWorldMap(worldId)
        .then((data) => {
          setMapData(data);
          setIsLoadingMap(false);
        })
        .catch((err) => {
          console.error('Failed to load world map:', err);
          setMapError(t.map?.error || 'Failed to load world map');
          setIsLoadingMap(false);
        });
    }
  }, [worldId, t.map?.error]);

  // Group locations by region for the standard view
  const locationsByRegion = useMemo(() => {
    const grouped = new Map<string, { regionName: string; continentName?: string; locations: Location[] }>();
    for (const loc of playthroughLocations) {
      const regionId = loc.regionId;
      const existing = grouped.get(regionId);
      if (existing) {
        existing.locations.push(loc);
      } else {
        grouped.set(regionId, {
          regionName: loc.region?.name || t.map.unknownRegion,
          continentName: undefined,
          locations: [loc],
        });
      }
    }
    return Array.from(grouped.entries());
  }, [playthroughLocations, t.map.unknownRegion]);

  // Group playthrough locations hierarchically (3-level view)
  const hierarchicalData = useMemo<HierarchicalContinent[]>(() => {
    if (!mapData || !mapData.continents) return [];
    const continentMap = new Map(mapData.continents.map((c) => [c._id, c]));
    const grouped = new Map<string, Map<string, { regionName: string; dangerLevel: number; locations: Location[] }>>();
    for (const loc of playthroughLocations) {
      if (!loc.region) continue;
      const continentId = loc.region.continentId;
      if (!grouped.has(continentId)) grouped.set(continentId, new Map());
      const regionGroup = grouped.get(continentId)!;
      if (!regionGroup.has(loc.region._id)) {
        regionGroup.set(loc.region._id, {
          regionName: loc.region.name,
          dangerLevel: loc.region.dangerLevel,
          locations: [],
        });
      }
      regionGroup.get(loc.region._id)!.locations.push(loc);
    }
    return Array.from(grouped.entries()).map(([continentId, regionsMap]) => {
      const continentInfo = continentMap.get(continentId);
      return {
        continentId,
        continentName: continentInfo?.name || t.map.unknownContinent,
        continentDescription: continentInfo?.description || '',
        climate: continentInfo?.climate || '',
        terrainType: continentInfo?.terrainType || '',
        regions: Array.from(regionsMap.entries()).map(([regionId, regionData]) => ({
          regionId,
          regionName: regionData.regionName,
          dangerLevel: regionData.dangerLevel,
          locations: regionData.locations,
        })),
      };
    });
  }, [mapData, playthroughLocations, t.map.unknownContinent]);

  const handleRetryMap = () => {
    if (!worldId) return;
    setIsLoadingMap(true);
    setMapError(null);
    getWorldMap(worldId)
      .then((data) => {
        setMapData(data);
        setIsLoadingMap(false);
      })
      .catch((err) => {
        console.error('Failed to load world map:', err);
        setMapError(t.map?.error || 'Failed to load world map');
        setIsLoadingMap(false);
      });
  };

  const handleRetryPlaythrough = () => {
    if (!playthroughId) return;
    fetchCurrentLocation(playthroughId);
    fetchAllLocations(playthroughId);
  };

  return {
    mapData,
    isLoadingMap,
    mapError,
    handleRetryMap,
    currentContext,
    playthroughLocations,
    locationsByRegion,
    hierarchicalData,
    isLoading,
    error,
    handleRetryPlaythrough,
    viewMode,
    setViewMode,
    expandedId,
    setExpandedId,
  };
}
