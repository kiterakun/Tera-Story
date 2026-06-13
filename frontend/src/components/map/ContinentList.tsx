import { useTranslation } from '../../i18n';
import { Globe, Mountain } from 'lucide-react';
import type { MapData } from '../../services/mapApi';

interface ContinentListProps {
  mapData: MapData | null;
}

export function ContinentList({ mapData }: ContinentListProps) {
  const t = useTranslation();

  if (!mapData || !mapData.continents || mapData.continents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-ink-400 bg-ink-800/30 border border-dashed border-ink-700 rounded-2xl">
        <Globe size={48} className="text-ink-500 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">{t.map.noContinentData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {mapData.continents.map((continent) => (
        <article
          key={continent._id}
          aria-labelledby={`continent-${continent._id}-title`}
          className="bg-ink-800/80 border border-ink-700/50 rounded-2xl overflow-hidden shadow-xl hover:border-accent-500/20 transition-all duration-300 backdrop-blur-md"
        >
          <header className="bg-gradient-to-r from-ink-900 via-ink-950 to-ink-900 px-6 sm:px-8 py-5 border-b border-ink-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Globe className="text-accent-400" size={20} aria-hidden="true" />
                <h2
                  id={`continent-${continent._id}-title`}
                  className="text-xl sm:text-2xl font-display text-ink-100 font-bold"
                >
                  {continent.name}
                </h2>
              </div>
              <p className="text-xs text-ink-200/50 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Climate: <span className="text-ink-200/70 font-semibold">{continent.climate}</span>
                </span>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-700" aria-hidden="true" />
                <span>
                  Culture: <span className="text-ink-200/70 font-semibold">{continent.dominantCulture}</span>
                </span>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-ink-700" aria-hidden="true" />
                <span>
                  Terrain: <span className="text-ink-200/70 font-semibold">{continent.terrainType}</span>
                </span>
              </p>
            </div>
            <span className="self-start sm:self-auto shrink-0 bg-accent-600/10 border border-accent-400/20 text-accent-400 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
              {t.worldCreate.regionsCount.replace('{count}', String(continent.regions?.length || 0))}
            </span>
          </header>

          <div className="p-6 sm:p-8 space-y-6">
            <p className="text-ink-200/80 leading-relaxed text-sm italic border-l-2 border-accent-500/30 pl-4 bg-accent-500/5 py-2.5 rounded-r-lg">
              {continent.description}
            </p>

            {continent.regions && continent.regions.length > 0 ? (
              <section aria-label="Regions" className="space-y-4 mt-6">
                <h3 className="text-xs uppercase tracking-widest text-accent-400/80 font-bold flex items-center gap-2">
                  <Mountain size={14} aria-hidden="true" />
                  {t.map.regionListLabel}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {continent.regions.map((region) => (
                    <article
                      key={region._id}
                      aria-labelledby={`region-${region._id}-title`}
                      className="bg-ink-950/40 border border-ink-700/40 rounded-xl p-4 sm:p-5 hover:border-ink-600/60 hover:bg-ink-950/60 transition-all duration-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4
                            id={`region-${region._id}-title`}
                            className="font-display font-semibold text-ink-100 text-base"
                          >
                            {region.name}
                          </h4>
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
                            <span className="text-ink-200/30" aria-hidden="true">•</span>
                            {region.resources.map((res, ri) => (
                              <span
                                key={ri}
                                className="bg-accent-600/5 text-accent-400/80 px-1.5 py-0.5 rounded border border-accent-400/10"
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <p className="text-xs text-ink-200/40 italic">{t.map.noRegionsDefined}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
