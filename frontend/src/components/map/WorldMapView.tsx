import { useTranslation } from '../../i18n';
import { Compass, ChevronLeft, MapPin } from 'lucide-react';
import { Spinner } from '../../design-system/Spinner';
import { useMapViewState } from '../../hooks/useMapViewState';
import { ContinentList } from './ContinentList';

interface WorldMapViewProps {
  worldId: string;
}

export function WorldMapView({ worldId }: WorldMapViewProps) {
  const t = useTranslation();
  const { mapData, isLoadingMap, mapError, handleRetryMap } = useMapViewState({ worldId });

  if (isLoadingMap) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center" role="status" aria-live="polite">
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
        <MapPin size={48} className="text-red-400" aria-hidden="true" />
        <p className="text-sm text-red-400">{mapError}</p>
        <button
          type="button"
          onClick={handleRetryMap}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          {t.map?.retry || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-ink-200/50 hover:text-accent-400 transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md px-1 py-0.5"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t.map.backToWorldDetail}
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Compass size={28} className="text-accent-400" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-display text-ink-100 font-bold">
            {t.map.geographicalOutline}
          </h1>
        </div>
        <p className="text-ink-200/60 mt-2 text-sm">
          {t.map.geographicalOutlineDesc}
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
      </div>

      <ContinentList mapData={mapData} />
    </div>
  );
}
