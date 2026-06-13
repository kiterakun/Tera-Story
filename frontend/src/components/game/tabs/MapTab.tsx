import { useEffect, useState } from 'react';
import { Compass, MapPin, Mountain, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWorldMap } from '../../../services/mapApi';
import { useStoryStore } from '../../../stores/storyStore';
import { useMap } from '../../../hooks/useMap';
import { DynamicStatList } from '../../DynamicStatDisplay';
import type { useTranslation } from '../../../i18n';

interface MapTabProps {
  playthroughId: string;
  t: ReturnType<typeof useTranslation>;
}

export function MapTab({ playthroughId, t }: MapTabProps) {
  const world = useStoryStore((state) => state.world);
  const navigate = useNavigate();
  const { currentContext, playthroughLocations, fetchCurrentLocation, fetchAllLocations } = useMap();

  const [continentMap, setContinentMap] = useState<Map<string, string>>(new Map());

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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* View Detailed Map Button */}
      <button
        onClick={() => navigate(`/playthroughs/${playthroughId}/map`)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-accent-600/20 cursor-pointer"
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

      {/* Discovered Locations */}
      {playthroughLocations.length > 0 && (
        <div>
          <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">
            {t.map.discoveredLocations}
          </h4>
          <div className="space-y-2">
            {playthroughLocations.map((loc) => (
              <div key={loc._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-ink-400" aria-hidden="true" />
                    <span className="text-sm text-ink-100 font-medium">{loc.name}</span>
                    <span className="text-xs text-ink-200/40 capitalize">
                      ({t.map.types[loc.type as keyof typeof t.map.types] || loc.type})
                    </span>
                  </div>
                  {loc.region && (
                    <div className="flex items-center gap-1.5 text-[9px] text-ink-200/40">
                      <span className="flex items-center gap-0.5">
                        <Mountain size={9} aria-hidden="true" />
                        {loc.region.name}
                      </span>
                      <span aria-hidden="true">/</span>
                      <span className="flex items-center gap-0.5">
                        <Globe size={9} aria-hidden="true" />
                        {continentMap.get(loc.region.continentId) || t.map.continent}
                      </span>
                    </div>
                  )}
                </div>
                {loc.dynamicStats && loc.dynamicStats.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {loc.dynamicStats.map((stat, idx) => (
                      <div key={idx} className="bg-ink-900/50 rounded px-1.5 py-0.5">
                        <DynamicStatList stats={[stat]} templates={world?.locationResourceTemplates} compact />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
