import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMap } from '../hooks/useMap';
import {
  MapPin,
  Navigation,
  Compass,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Globe,
  Mountain,
  AlertTriangle,
  Eye,
  TreePine,
  Home,
  Shield,
  Crosshair,
} from 'lucide-react';
import { Spinner } from '../design-system/Spinner';
import { useTranslation } from '../i18n';
import { getWorldMap } from '../services/mapApi';
import type { Location, MapData } from '../services/mapApi';
import { DynamicStatList } from '../components/DynamicStatDisplay';
import { useStoryStore } from '../stores/storyStore';
import type { ResourceTemplate } from '../types/entities';

// ── Constants ──────────────────────────────────────────────────────────

const LOCATION_TYPE_ICONS: Record<string, typeof MapPin> = {
  town: Home,
  dungeon: AlertTriangle,
  wilderness: TreePine,
  ruin: Eye,
  sanctuary: Shield,
  crossroad: Crosshair,
};

const LOCATION_TYPE_COLORS: Record<string, string> = {
  town: 'text-amber-400',
  dungeon: 'text-red-400',
  wilderness: 'text-green-400',
  ruin: 'text-stone-400',
  sanctuary: 'text-blue-400',
  crossroad: 'text-yellow-400',
};

const LOCATION_TYPE_BG: Record<string, string> = {
  town: 'bg-amber-900/30 border-amber-700/50',
  dungeon: 'bg-red-900/30 border-red-700/50',
  wilderness: 'bg-green-900/30 border-green-700/50',
  ruin: 'bg-stone-800/50 border-stone-600/50',
  sanctuary: 'bg-blue-900/30 border-blue-700/50',
  crossroad: 'bg-yellow-900/30 border-yellow-700/50',
};

const STATUS_BADGES: Record<string, { labelKey: string; className: string }> = {
  undiscovered: { labelKey: 'undiscovered', className: 'bg-stone-700 text-stone-400' },
  known: { labelKey: 'known', className: 'bg-blue-900/50 text-blue-300' },
  visited: { labelKey: 'visited', className: 'bg-green-900/50 text-green-300' },
  cleared: { labelKey: 'cleared', className: 'bg-amber-900/50 text-amber-300' },
};

// ── Sub-components ────────────────────────────────────────────────────

function LocationCard({
  location,
  isCurrent,
  isExpanded,
  onToggle,
  templates,
}: {
  location: Location;
  isCurrent?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  templates?: ResourceTemplate[];
}) {
  const t = useTranslation();
  const Icon = LOCATION_TYPE_ICONS[location.type] || MapPin;
  const colorClass = LOCATION_TYPE_COLORS[location.type] || 'text-stone-400';
  const bgClass = LOCATION_TYPE_BG[location.type] || 'bg-stone-800/50 border-stone-600/50';
  const statusInfo = STATUS_BADGES[location.status] || STATUS_BADGES.undiscovered!;
  const statusLabel = t.map.status[statusInfo.labelKey as keyof typeof t.map.status];

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isCurrent
          ? 'border-accent-500/60 bg-accent-900/20 shadow-lg shadow-accent-900/20'
          : bgClass
      } ${onToggle ? 'cursor-pointer hover:border-ink-600' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-ink-100 text-base">{location.name}</h3>
            {isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-600/30 text-accent-300 border border-accent-500/40">
                {t.map.currentBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs ${colorClass}`}>
              {t.map.types[location.type as keyof typeof t.map.types] || location.type}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.className}`}>
              {statusLabel}
            </span>
          </div>
          {isExpanded && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-ink-200/80 leading-relaxed">
                {location.description}
              </p>
              {location.dynamicStats && location.dynamicStats.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {location.dynamicStats.map((stat, idx) => (
                    <div key={idx} className="bg-ink-950/50 rounded-lg px-2 py-1">
                      <DynamicStatList stats={[stat]} templates={templates} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!isExpanded && location.description && (
            <p className="text-sm text-ink-200/60 mt-1 line-clamp-2">
              {location.description}
            </p>
          )}
        </div>
        {onToggle && (
          <div className="text-ink-400 shrink-0">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </div>
    </div>
  );
}

function RegionGroup({
  regionName,
  continentName,
  locations,
  currentLocationId,
  expandedId,
  onToggleLocation,
  templates,
}: {
  regionName: string;
  continentName?: string;
  locations: Location[];
  currentLocationId?: string;
  expandedId: string | null;
  onToggleLocation: (id: string) => void;
  templates?: ResourceTemplate[];
}) {
  const t = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Mountain size={14} className="text-ink-400" />
        <h3 className="font-display text-ink-200 text-sm">{regionName}</h3>
        {continentName && (
          <span className="text-xs text-ink-400">({continentName})</span>
        )}
        <span className="text-xs text-ink-500 ml-auto">
          {t.map.locationsCount.replace('{count}', String(locations.length))}
        </span>
      </div>
      <div className="space-y-2 pl-4 border-l-2 border-ink-800">
        {locations.map((loc) => (
          <LocationCard
            key={loc._id}
            location={loc}
            isCurrent={loc._id === currentLocationId}
            isExpanded={expandedId === loc._id}
            onToggle={() => onToggleLocation(loc._id)}
            templates={templates}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function MapPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { playthroughId, worldId } = useParams<{ playthroughId?: string; worldId?: string }>();
  const {
    currentContext,
    playthroughLocations,
    isLoading,
    error,
    fetchCurrentLocation,
    fetchAllLocations,
  } = useMap();
  const world = useStoryStore((state) => state.world);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(!!worldId);
  const [mapError, setMapError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | '3level'>('standard');

  // Initial playthrough fetch
  useEffect(() => {
    if (playthroughId) {
      fetchCurrentLocation(playthroughId);
      fetchAllLocations(playthroughId);
    }
  }, [playthroughId, fetchCurrentLocation, fetchAllLocations]);

  // Load world map in background for playthroughs to map continent IDs to names
  useEffect(() => {
    if (playthroughId && world?._id) {
      getWorldMap(world._id)
        .then((data) => {
          setMapData(data);
        })
        .catch((err) => console.error('Failed to prefetch world map:', err));
    }
  }, [playthroughId, world?._id]);

  // Initial world map fetch (for World detail skeleton map view)
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

  // Group locations by region (standard view)
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
          continentName: undefined, // Would need continent data
          locations: [loc],
        });
      }
    }

    return Array.from(grouped.entries());
  }, [playthroughLocations, t]);

  // Group playthrough locations hierarchically (3-level map view)
  const hierarchicalPlaythroughMap = useMemo(() => {
    if (!mapData || !mapData.continents) return [];

    const continentMap = new Map(mapData.continents.map(c => [c._id, c]));
    const grouped = new Map<string, Map<string, { regionName: string; dangerLevel: number; locations: Location[] }>>();

    for (const loc of playthroughLocations) {
      if (!loc.region) continue;
      const region = loc.region;
      const continentId = region.continentId;

      if (!grouped.has(continentId)) {
        grouped.set(continentId, new Map());
      }

      const regionGroup = grouped.get(continentId)!;
      if (!regionGroup.has(region._id)) {
        regionGroup.set(region._id, {
          regionName: region.name,
          dangerLevel: region.dangerLevel,
          locations: []
        });
      }

      regionGroup.get(region._id)!.locations.push(loc);
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
          locations: regionData.locations
        }))
      };
    });
  }, [mapData, playthroughLocations, t]);

  const handleToggleLocation = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Loading state
  if (worldId) {
    if (isLoadingMap) {
      return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-ink-400">
            <Spinner size="lg" className="w-10 h-10" />
            <p className="text-sm">{t.map?.loading || 'Loading world map skeleton...'}</p>
          </div>
        </div>
      );
    }

    if (mapError) {
      return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-ink-300">
          <MapPin size={48} className="text-red-400" />
          <p className="text-sm text-red-400">{mapError}</p>
          <button
            onClick={() => {
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
            }}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors"
          >
            {t.map?.retry || 'Retry'}
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
        {/* Breadcrumb / Navigation */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-ink-200/50 hover:text-accent-400 transition-colors text-sm font-medium"
          >
            <ChevronLeft size={16} />
            {t.map.backToWorldDetail}
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Compass size={28} className="text-accent-400" />
            <h1 className="text-2xl sm:text-3xl font-display text-ink-100 font-bold">
              {t.map.geographicalOutline}
            </h1>
          </div>
          <p className="text-ink-200/60 mt-2 text-sm">
            {t.map.geographicalOutlineDesc}
          </p>
          <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
        </div>

        {/* Continents List */}
        {!mapData || !mapData.continents || mapData.continents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-400 bg-ink-800/30 border border-dashed border-ink-700 rounded-2xl">
            <Globe size={48} className="text-ink-500 mb-3" />
            <p className="text-sm font-medium">{t.map.noContinentData}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {mapData.continents.map((continent) => (
              <div 
                key={continent._id} 
                className="bg-ink-800/80 border border-ink-700/50 rounded-2xl overflow-hidden shadow-xl hover:border-accent-500/20 transition-all duration-300 backdrop-blur-md"
              >
                {/* Continent Header Banner */}
                <div className="bg-gradient-to-r from-ink-900 via-ink-950 to-ink-900 px-6 sm:px-8 py-5 border-b border-ink-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Globe className="text-accent-400" size={20} />
                      <h2 className="text-xl sm:text-2xl font-display text-ink-100 font-bold">{continent.name}</h2>
                    </div>
                    <p className="text-xs text-ink-200/50 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Climate: <span className="text-ink-200/70 font-semibold">{continent.climate}</span></span>
                      <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-700" />
                      <span>Culture: <span className="text-ink-200/70 font-semibold">{continent.dominantCulture}</span></span>
                      <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-700" />
                      <span>Terrain: <span className="text-ink-200/70 font-semibold">{continent.terrainType}</span></span>
                    </p>
                  </div>
                  <span className="self-start sm:self-auto shrink-0 bg-accent-600/10 border border-accent-400/20 text-accent-400 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    {t.worldCreate.regionsCount.replace('{count}', String(continent.regions?.length || 0))}
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Description */}
                  <p className="text-ink-200/80 leading-relaxed text-sm italic border-l-2 border-accent-500/30 pl-4 bg-accent-500/5 py-2.5 rounded-r-lg">
                    {continent.description}
                  </p>

                  {/* Nested Regions Section */}
                  {continent.regions && continent.regions.length > 0 ? (
                    <div className="space-y-4 mt-6">
                      <h3 className="text-xs uppercase tracking-widest text-accent-400/80 font-bold flex items-center gap-2">
                        <Mountain size={14} />
                        {t.map.regionListLabel}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {continent.regions.map((region) => (
                          <div 
                            key={region._id} 
                            className="bg-ink-950/40 border border-ink-700/40 rounded-xl p-4 sm:p-5 hover:border-ink-600/60 hover:bg-ink-950/60 transition-all duration-200 shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-display font-semibold text-ink-100 text-base">{region.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  region.dangerLevel > 7 
                                    ? 'bg-red-400/10 text-red-400 border-red-400/20' 
                                    : region.dangerLevel > 4 
                                    ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' 
                                    : 'bg-green-400/10 text-green-400 border-green-400/20'
                                }`}>
                                  {t.map.dangerLabel.replace('{level}', String(region.dangerLevel))}
                                </span>
                              </div>
                              <p className="text-ink-200/70 text-xs leading-relaxed mb-4 whitespace-pre-wrap">
                                {region.description}
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-ink-700/20 mt-auto text-[10px] text-ink-200/50">
                              <span className="capitalize px-2 py-0.5 bg-ink-800 rounded-md border border-ink-700/50">
                                {region.terrainType}
                              </span>
                              {region.resources && region.resources.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-ink-200/30">•</span>
                                  {region.resources.map((res, ri) => (
                                    <span key={ri} className="bg-accent-600/5 text-accent-400/80 px-1.5 py-0.5 rounded border border-accent-400/10">
                                      {res}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-200/40 italic">{t.map.noRegionsDefined}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Playthrough map loading state
  if (isLoading && !currentContext && playthroughLocations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <Spinner size="lg" className="w-10 h-10" />
          <p className="text-sm">{t.map.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentContext && playthroughLocations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-ink-300">
        <MapPin size={48} className="text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => {
            if (playthroughId) {
              fetchCurrentLocation(playthroughId);
              fetchAllLocations(playthroughId);
            }
          }}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors"
        >
          {t.map.retry}
        </button>
      </div>
    );
  }

  // Empty state
  if (!currentContext && playthroughLocations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-ink-400">
        <Compass size={48} className="text-ink-500" />
        <div className="text-center">
          <h2 className="font-display text-ink-300 text-lg mb-2">{t.map.emptyTitle}</h2>
          <p className="text-sm text-ink-500 max-w-md">
            {t.map.emptySubtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back to Play Screen Button */}
      {playthroughId && (
        <div className="mb-6">
          <button
            onClick={() => navigate(`/play/${playthroughId}`)}
            className="inline-flex items-center gap-1.5 text-ink-200/50 hover:text-accent-400 transition-colors text-sm font-medium cursor-pointer"
          >
            <ChevronLeft size={16} />
            {t.map.backToPlayScreen}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <Compass size={28} className="text-accent-400" />
            <h1 className="text-2xl sm:text-3xl font-display text-ink-100 font-bold">{t.map.title}</h1>
          </div>
          <p className="text-ink-200/60 mt-2 text-sm">
            {t.map.subtitle}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-ink-800/40 border border-ink-700/50 p-1 rounded-xl backdrop-blur-sm shrink-0 w-full md:w-auto">
          <button
            onClick={() => setViewMode('standard')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'standard'
                ? 'bg-accent-600 text-white shadow-md shadow-accent-600/20'
                : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/30'
            }`}
          >
            <Compass size={14} />
            {t.map.standardView}
          </button>
          <button
            onClick={() => setViewMode('3level')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all ${
              viewMode === '3level'
                ? 'bg-accent-600 text-white shadow-md shadow-accent-600/20'
                : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/30'
            }`}
          >
            <Globe size={14} />
            {t.map.threeLevelMap}
          </button>
        </div>
      </div>
      <div className="mb-8 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />

      {/* ── 3-LEVEL HIERARCHICAL MAP VIEW ──────────────────────────────────── */}
      {viewMode === '3level' ? (
        <div className="space-y-8 animate-fade-in">
          {hierarchicalPlaythroughMap.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ink-400 bg-ink-800/30 border border-dashed border-ink-700 rounded-2xl">
              <Globe size={48} className="text-ink-500 mb-3" />
              <p className="text-sm font-medium">{t.map.noDiscoveredLands}</p>
            </div>
          ) : (
            hierarchicalPlaythroughMap.map((continent) => (
              <div 
                key={continent.continentId} 
                className="bg-ink-800/80 border border-ink-700/50 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md"
              >
                {/* Continent Header */}
                <div className="bg-gradient-to-r from-ink-900 via-ink-950 to-ink-900 px-6 py-4 border-b border-ink-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe className="text-accent-400" size={18} />
                    <h2 className="text-base sm:text-lg font-display text-ink-100 font-bold">{continent.continentName}</h2>
                  </div>
                  {continent.climate && (
                    <span className="text-[10px] bg-ink-850 border border-ink-700/60 text-ink-200/60 px-2.5 py-0.5 rounded-full font-medium capitalize">
                      {continent.climate}
                    </span>
                  )}
                </div>

                {/* Continent Body containing Regions */}
                <div className="p-6 space-y-6 bg-ink-900/10">
                  {continent.regions.map((region) => (
                    <div 
                      key={region.regionId} 
                      className="border border-ink-700/30 rounded-xl bg-ink-950/20 p-5 space-y-4 shadow-sm"
                    >
                      {/* Region Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-ink-700/10">
                        <div className="flex items-center gap-2">
                          <Mountain className="text-accent-400/80" size={15} />
                          <h3 className="font-semibold text-ink-150 text-sm">{region.regionName}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          region.dangerLevel > 7 
                            ? 'bg-red-400/10 text-red-400 border-red-400/20' 
                            : region.dangerLevel > 4 
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' 
                            : 'bg-green-400/10 text-green-400 border-green-400/20'
                        }`}>
                          {t.map.dangerLabel.replace('{level}', String(region.dangerLevel))}
                        </span>
                      </div>

                      {/* Locations inside Region */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {region.locations.map((loc) => {
                          const isCurrent = loc._id === currentContext?.location?._id;
                          return (
                            <div 
                              key={loc._id} 
                              className={`p-4 rounded-xl border transition-all duration-200 shadow-sm relative overflow-hidden ${
                                isCurrent 
                                  ? 'bg-accent-600/10 border-accent-400/50 ring-1 ring-accent-400/20' 
                                  : 'bg-ink-950/40 border-ink-700/40 hover:border-ink-600/60'
                              }`}
                            >
                              {/* Background Glow for current location */}
                              {isCurrent && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full blur-xl pointer-events-none -mr-4 -mt-4" />
                              )}

                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {isCurrent ? (
                                    <Crosshair className="text-accent-400 shrink-0 animate-pulse" size={14} />
                                  ) : (
                                    <MapPin className="text-ink-400 shrink-0" size={14} />
                                  )}
                                  <h4 className="font-semibold text-ink-100 text-xs sm:text-sm">{loc.name}</h4>
                                </div>
                                {isCurrent && (
                                  <span className="flex items-center gap-1.5 bg-accent-600/20 text-accent-300 border border-accent-400/30 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase select-none animate-pulse shrink-0">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-500"></span>
                                    </span>
                                    {t.map.youAreHere}
                                  </span>
                                )}
                              </div>

                              <p className="text-ink-200/70 text-xs leading-relaxed mb-3 pr-2">
                                {loc.description}
                              </p>

                              <div className="flex items-center justify-between text-[9px] text-ink-200/40 pt-2 border-t border-ink-700/10">
                                <span className="uppercase font-semibold tracking-wider bg-ink-800/80 px-2 py-0.5 rounded border border-ink-700/40 capitalize">
                                  {t.map.types[loc.type as keyof typeof t.map.types] || loc.type}
                                </span>
                                <span className="italic">
                                  {t.map.status[loc.status as keyof typeof t.map.status] || loc.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── STANDARD MAP VIEW ─────────────────────────────────────────────── */
        <>
          {/* Current Location */}
          {currentContext?.location && (
            <div className="mb-8">
              <h2 className="font-display text-ink-200 text-sm mb-3 flex items-center gap-2">
                <Navigation size={14} className="text-accent-400" />
                {t.map.currentLocation}
              </h2>
              <LocationCard
                location={currentContext.location}
                isCurrent
                isExpanded
                templates={world?.locationResourceTemplates}
              />

              {/* Connected Locations */}
              {currentContext.connectedLocations.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-display text-ink-300 text-xs mb-2 flex items-center gap-2">
                    <Globe size={12} className="text-ink-400" />
                    {t.map.connectedDestinations}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {currentContext.connectedLocations.map((loc) => (
                      <LocationCard
                        key={loc._id}
                        location={loc}
                        isExpanded={expandedId === loc._id}
                        onToggle={() => handleToggleLocation(loc._id)}
                        templates={world?.locationResourceTemplates}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Discovered Locations */}
          {locationsByRegion.length > 0 && (
            <div>
              <h2 className="font-display text-ink-200 text-sm mb-4 flex items-center gap-2">
                <MapPin size={14} className="text-ink-400" />
                {t.map.discoveredLocations}
                <span className="text-xs text-ink-500 ml-1">({playthroughLocations.length})</span>
              </h2>
              <div className="space-y-6">
                {locationsByRegion.map(([regionId, { regionName, continentName, locations }]) => (
                  <RegionGroup
                    key={regionId}
                    regionName={regionName}
                    continentName={continentName}
                    locations={locations}
                    currentLocationId={currentContext?.location?._id}
                    expandedId={expandedId}
                    onToggleLocation={handleToggleLocation}
                    templates={world?.locationResourceTemplates}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
