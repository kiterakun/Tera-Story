import { useEffect, useState, useMemo } from 'react';
import { Compass, MapPin, Mountain, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWorldMap } from '../../../services/mapApi';
import { useStoryStore } from '../../../stores/storyStore';
import { useMap } from '../../../hooks/useMap';
import { DynamicStatList } from '../../DynamicStatDisplay';
import { LocationCard, RegionGroup } from '../../map';
import type { useTranslation } from '../../../i18n';
import type { Location } from '../../../services/mapApi';

interface MapTabProps {
  playthroughId: string;
  t: ReturnType<typeof useTranslation>;
}

export function MapTab({ playthroughId, t }: MapTabProps) {
  const world = useStoryStore((state) => state.world);
  const navigate = useNavigate();
  const { currentContext, playthroughLocations, fetchCurrentLocation, fetchAllLocations } = useMap();

  const [continentMap, setContinentMap] = useState<Map<string, string>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load world map to get continent names
  useEffect(() => {
    if (world?._id) {
      getWorldMap(world._id)
        .then((data) => {
          if (data && data.continents) {
            const m = new Map<string, string>();
            data.continents.forEach((c) => {
              m.set(c._id, c.name);
            });
            setContinentMap(m);
          }
        })
        .catch((err) => console.error('Failed to load map data in MapTab:', err));
    }
  }, [world?._id]);

  // Load playthrough locations when this tab mounts
  useEffect(() => {
    fetchCurrentLocation(playthroughId);
    fetchAllLocations(playthroughId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playthroughId]);

  const regions = useMemo(() => {
    const grouped = new Map<string, { regionName: string; continentName?: string; locations: Location[] }>();
    for (const loc of playthroughLocations) {
      const regionId = loc.region?._id ?? 'unknown';
      const existing = grouped.get(regionId);
      if (existing) {
        existing.locations.push(loc);
      } else {
        grouped.set(regionId, {
          regionName: loc.region?.name ?? t.map.unknownRegion,
          continentName: loc.region ? continentMap.get(loc.region.continentId) : undefined,
          locations: [loc],
        });
      }
    }
    return Array.from(grouped.values());
  }, [playthroughLocations, continentMap, t.map.unknownRegion]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* View Detailed Map Button */}
      <button
        type="button"
        onClick={() => navigate(`/playthroughs/${playthroughId}/map`)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-accent-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Compass size={16} aria-hidden="true" />
        {t.map.viewDetailedMap}
      </button>

      {/* Current Location */}
      {currentContext?.location ? (
        <div className="bg-accent-900/20 border border-accent-500/40 rounded-xl p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-accent-400" aria-hidden="true" />
              <h4 className="font-display text-accent-300">{t.map.currentLocation}</h4>
            </div>
            {currentContext.region && (
              <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-accent-300">
                <span className="flex items-center gap-1">
                  <Mountain size={10} className="text-accent-400" aria-hidden="true" />
                  {currentContext.region.name}
                </span>
                <span className="text-accent-500/30" aria-hidden="true">|</span>
                <span className="flex items-center gap-1">
                  <Globe size={10} className="text-accent-400" aria-hidden="true" />
                  {currentContext.continent?.name || t.map.continent}
                </span>
              </div>
            )}
          </div>
          <h3 className="font-display text-lg text-ink-100">{currentContext.location.name}</h3>
          <p className="text-sm text-ink-200/70 mt-1">{currentContext.location.description}</p>
          {currentContext.location.dynamicStats && currentContext.location.dynamicStats.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {currentContext.location.dynamicStats.map((stat, idx) => (
                <div key={idx} className="bg-ink-900/50 rounded px-2 py-1">
                  <DynamicStatList stats={[stat]} templates={world?.locationResourceTemplates} compact />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-200/50 text-center py-4">{t.map.noLocation}</p>
      )}

      {/* Discovered Locations grouped by region */}
      {regions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs text-ink-200/50 uppercase tracking-wider">
            {t.map.discoveredLocations}
          </h4>
          {regions.map((region) => (
            <RegionGroup
              key={region.regionName}
              regionName={region.regionName}
              continentName={region.continentName}
              locations={region.locations}
              expandedId={expandedId}
              onToggleLocation={setExpandedId}
              templates={world?.locationResourceTemplates}
            />
          ))}
        </div>
      )}

      {/* Hidden reference: LocationCard is exported but unused at this level;
          keeps the export in scope for downstream consumers. */}
      {void LocationCard}
    </div>
  );
}
