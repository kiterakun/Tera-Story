import React from 'react';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { MapData, World } from '../../services/worldApi';

interface MapSelectionStepProps {
  mapData: MapData | null;
  selectedRegionId: string | null;
  onSelectRegion: (id: string) => void;
  premise: string;
  onPremiseChange: (value: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
  isCreating: boolean;
  createdWorld: World | null;
  terrainColors: Record<string, string>;
}

export function MapSelectionStep({
  mapData,
  selectedRegionId,
  onSelectRegion,
  premise,
  onPremiseChange,
  onConfirm,
  onSkip,
  isCreating,
  createdWorld,
  terrainColors
}: MapSelectionStepProps) {
  const t = useTranslation();

  const selectedRegion = mapData?.regions?.find(r => r._id === selectedRegionId);
  const selectedContinent = mapData?.continents?.find(c => c._id === selectedRegion?.continentId);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 min-h-[500px] relative">
          {isCreating && (
            <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 size={40} className="animate-spin text-accent-400 mx-auto mb-3" />
                <p className="text-ink-100 font-medium">{t.worldCreate.creatingPlaythrough}</p>
              </div>
            </div>
          )}
          
          {/* Region Selection List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {mapData?.regions?.map(region => {
              const continent = mapData.continents.find(c => c._id === region.continentId);
              const isSelected = region._id === selectedRegionId;

              return (
                <button
                  key={region._id}
                  type="button"
                  onClick={() => onSelectRegion(region._id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-accent-400 bg-accent-600/10 shadow-lg shadow-accent-600/10'
                      : 'border-ink-700 bg-ink-900 hover:border-ink-600 hover:bg-ink-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-ink-100">{region.name}</h3>
                      {continent && (
                        <p className="text-xs text-ink-200/60 mt-0.5">
                          {continent.name} — {continent.climate}
                        </p>
                      )}
                    </div>
                    <span
                      className="px-2 py-1 rounded-md text-xs text-white shrink-0"
                      style={{ backgroundColor: terrainColors[region.terrainType] || terrainColors.default }}
                    >
                      {region.terrainType}
                    </span>
                  </div>
                  <p className="text-sm text-ink-200/80 mt-2">{region.description}</p>
                </button>
              );
            })}
            {(!mapData?.regions || mapData.regions.length === 0) && (
              <div className="text-center py-8 text-ink-400">
                <MapPin size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t.worldCreate.noRegions || 'No regions available'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      <aside className="lg:w-80 shrink-0">
        <div className="lg:sticky lg:top-8 space-y-4">
          {/* Selected Region Info */}
          {selectedRegion ? (
            <div className="bg-ink-800 border border-accent-400/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-accent-400" />
                <h2 className="text-lg font-display text-ink-100">
                  {selectedRegion.name}
                </h2>
              </div>
              
              {selectedContinent && (
                <p className="text-xs text-ink-200/60 mb-2">
                  {selectedContinent.name} • {selectedContinent.climate}
                </p>
              )}
              
              <p className="text-sm text-ink-200/80 mb-3">
                {selectedRegion.description}
              </p>
              
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="px-2 py-1 rounded-md text-white"
                  style={{ backgroundColor: terrainColors[selectedRegion.terrainType] || terrainColors.default }}
                >
                  {selectedRegion.terrainType}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-ink-800/50 border border-ink-700 rounded-2xl p-5 text-center">
              <MapPin size={24} className="text-ink-500 mx-auto mb-3" />
              <p className="text-ink-200/40 text-sm italic">
                {t.worldCreate.spawnHint}
              </p>
            </div>
          )}

          {/* Premise */}
          <div>
            <label className="block text-sm font-medium text-ink-200/80 mb-2">
              {t.worldCreate.premiseLabel ?? 'Story Premise (optional)'}
            </label>
            <textarea
              className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all resize-none"
              rows={3}
              placeholder={t.worldCreate.premisePlaceholder ?? 'Describe your character\'s journey or the story you want to experience...'}
              value={premise}
              onChange={(e) => onPremiseChange(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={!selectedRegionId || isCreating}
              className="w-full px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-lg hover:shadow-accent-600/20 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t.worldCreate.creatingPlaythrough}
                </>
              ) : (
                <>
                  <Check size={16} />
                  {t.worldCreate.confirmSpawn}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onSkip}
              disabled={isCreating}
              className="w-full px-5 py-2.5 font-medium text-ink-200 hover:text-ink-100 transition-colors text-sm rounded-xl hover:bg-ink-800 disabled:opacity-50"
            >
              {t.worldCreate.skipMap}
            </button>
          </div>

          {/* World Info */}
          {createdWorld && (
            <div className="bg-ink-800/30 border border-ink-700/50 rounded-xl p-4">
              <p className="text-xs text-ink-200/60 mb-1">{t.worldCreate.worldCreated}</p>
              <p className="text-sm font-medium text-ink-100">{createdWorld.name}</p>
              <p className="text-xs text-ink-200/40 mt-1">{t.worldCreate.regionsCount.replace('{count}', String(mapData?.regions?.length || 0))}</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
