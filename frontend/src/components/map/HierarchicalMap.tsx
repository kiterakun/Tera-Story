import { useTranslation } from '../../i18n';
import { Globe, Mountain, MapPin, Crosshair } from 'lucide-react';
import type { Location } from '../../services/playthroughApi';

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

interface HierarchicalMapProps {
  data: HierarchicalContinent[];
  currentLocationId?: string;
}

export function HierarchicalMap({ data, currentLocationId }: HierarchicalMapProps) {
  const t = useTranslation();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-ink-400 bg-ink-800/30 border border-dashed border-ink-700 rounded-2xl">
        <Globe size={48} className="text-ink-500 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">{t.map.noDiscoveredLands}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {data.map((continent) => (
        <article
          key={continent.continentId}
          aria-labelledby={`continent-${continent.continentId}-h-title`}
          className="bg-ink-800/80 border border-ink-700/50 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md"
        >
          <header className="bg-gradient-to-r from-ink-900 via-ink-950 to-ink-900 px-6 py-4 border-b border-ink-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="text-accent-400" size={18} aria-hidden="true" />
              <h2
                id={`continent-${continent.continentId}-h-title`}
                className="text-base sm:text-lg font-display text-ink-100 font-bold"
              >
                {continent.continentName}
              </h2>
            </div>
            {continent.climate && (
              <span className="text-[10px] bg-ink-850 border border-ink-700/60 text-ink-200/60 px-2.5 py-0.5 rounded-full font-medium capitalize">
                {continent.climate}
              </span>
            )}
          </header>

          <div className="p-6 space-y-6 bg-ink-900/10">
            {continent.regions.map((region) => (
              <section
                key={region.regionId}
                aria-labelledby={`region-${region.regionId}-h-title`}
                className="border border-ink-700/30 rounded-xl bg-ink-950/20 p-5 space-y-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-ink-700/10">
                  <div className="flex items-center gap-2">
                    <Mountain className="text-accent-400/80" size={15} aria-hidden="true" />
                    <h3
                      id={`region-${region.regionId}-h-title`}
                      className="font-semibold text-ink-150 text-sm"
                    >
                      {region.regionName}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      region.dangerLevel > 7
                        ? 'bg-red-400/10 text-red-400 border-red-400/20'
                        : region.dangerLevel > 4
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          : 'bg-green-400/10 text-green-400 border-green-400/20'
                    }`}
                  >
                    {t.map.dangerLabel.replace('{level}', String(region.dangerLevel))}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {region.locations.map((loc) => {
                    const isCurrent = loc._id === currentLocationId;
                    return (
                      <div
                        key={loc._id}
                        className={`p-4 rounded-xl border transition-all duration-200 shadow-sm relative overflow-hidden ${
                          isCurrent
                            ? 'bg-accent-600/10 border-accent-400/50 ring-1 ring-accent-400/20'
                            : 'bg-ink-950/40 border-ink-700/40 hover:border-ink-600/60'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full blur-xl pointer-events-none -mr-4 -mt-4" />
                        )}

                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {isCurrent ? (
                              <Crosshair className="text-accent-400 shrink-0 animate-pulse" size={14} aria-hidden="true" />
                            ) : (
                              <MapPin className="text-ink-400 shrink-0" size={14} aria-hidden="true" />
                            )}
                            <h4 className="font-semibold text-ink-100 text-xs sm:text-sm">{loc.name}</h4>
                          </div>
                          {isCurrent && (
                            <span className="flex items-center gap-1.5 bg-accent-600/20 text-accent-300 border border-accent-400/30 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase select-none animate-pulse shrink-0">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-500" />
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
              </section>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
