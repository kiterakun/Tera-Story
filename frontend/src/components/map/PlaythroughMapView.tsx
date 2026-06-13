import { useTranslation } from '../../i18n';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronLeft, Navigation, MapPin } from 'lucide-react';
import { Spinner } from '../../design-system/Spinner';
import { useMapViewState } from '../../hooks/useMapViewState';
import { useStoryStore } from '../../stores/storyStore';
import { LocationCard } from './LocationCard';
import { RegionGroup } from './RegionGroup';
import { HierarchicalMap } from './HierarchicalMap';
import { MapViewToggle } from './MapViewToggle';
import { MapLegend } from './MapLegend';

interface PlaythroughMapViewProps {
  playthroughId: string;
}

export function PlaythroughMapView({ playthroughId }: PlaythroughMapViewProps) {
  const t = useTranslation();
  const navigate = useNavigate();
  const world = useStoryStore((state) => state.world);
  const {
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
  } = useMapViewState({ playthroughId });

  if (isLoading && !currentContext && playthroughLocations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <Spinner size="lg" className="w-10 h-10" />
          <p className="text-sm">{t.map.loading}</p>
        </div>
      </div>
    );
  }

  if (error && !currentContext && playthroughLocations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-ink-300">
        <MapPin size={48} className="text-red-400" aria-hidden="true" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={handleRetryPlaythrough}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          {t.map.retry}
        </button>
      </div>
    );
  }

  if (!currentContext && playthroughLocations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-ink-400">
        <Compass size={48} className="text-ink-500" aria-hidden="true" />
        <div className="text-center">
          <h2 className="font-display text-ink-300 text-lg mb-2">{t.map.emptyTitle}</h2>
          <p className="text-sm text-ink-500 max-w-md">{t.map.emptySubtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(`/play/${playthroughId}`)}
          className="inline-flex items-center gap-1.5 text-ink-200/50 hover:text-accent-400 transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md px-1 py-0.5"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t.map.backToPlayScreen}
        </button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <Compass size={28} className="text-accent-400" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-display text-ink-100 font-bold">{t.map.title}</h1>
          </div>
          <p className="text-ink-200/60 mt-2 text-sm">{t.map.subtitle}</p>
        </div>
        <MapViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>
      <div className="mb-8 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />

      {viewMode === '3level' ? (
        <HierarchicalMap data={hierarchicalData} currentLocationId={currentContext?.location?._id} />
      ) : (
        <>
          {currentContext?.location && (
            <div className="mb-8">
              <h2 className="font-display text-ink-200 text-sm mb-3 flex items-center gap-2">
                <Navigation size={14} className="text-accent-400" aria-hidden="true" />
                {t.map.currentLocation}
              </h2>
              <LocationCard
                location={currentContext.location}
                isCurrent
                isExpanded
                templates={world?.locationResourceTemplates}
              />

              {currentContext.connectedLocations.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-display text-ink-300 text-xs mb-2 flex items-center gap-2">
                    <Compass size={12} className="text-ink-400" aria-hidden="true" />
                    {t.map.connectedDestinations}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {currentContext.connectedLocations.map((loc) => (
                      <LocationCard
                        key={loc._id}
                        location={loc}
                        isExpanded={expandedId === loc._id}
                        onToggle={() => setExpandedId(expandedId === loc._id ? null : loc._id)}
                        templates={world?.locationResourceTemplates}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {locationsByRegion.length > 0 && (
            <div>
              <h2 className="font-display text-ink-200 text-sm mb-4 flex items-center gap-2">
                <MapPin size={14} className="text-ink-400" aria-hidden="true" />
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
                    onToggleLocation={setExpandedId}
                    templates={world?.locationResourceTemplates}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <aside className="mt-8" aria-label="Map legend">
        <MapLegend />
      </aside>
    </div>
  );
}
