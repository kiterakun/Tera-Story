import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMap } from '../hooks/useMap';
import {
  MapPin,
  Navigation,
  Compass,
  Loader2,
  ChevronDown,
  ChevronRight,
  Globe,
  Mountain,
  AlertTriangle,
  Eye,
  TreePine,
  Home,
  Shield,
  Crosshair,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import type { Location } from '../services/mapApi';
import { DynamicStatList } from '../components/DynamicStatDisplay';

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
}: {
  location: Location;
  isCurrent?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
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
                      <DynamicStatList stats={[stat]} compact />
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
}: {
  regionName: string;
  continentName?: string;
  locations: Location[];
  currentLocationId?: string;
  expandedId: string | null;
  onToggleLocation: (id: string) => void;
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
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function MapPage() {
  const t = useTranslation();
  const { playthroughId } = useParams<{ playthroughId: string }>();
  const {
    currentContext,
    playthroughLocations,
    isLoading,
    error,
    fetchCurrentLocation,
    fetchAllLocations,
  } = useMap();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    if (playthroughId) {
      fetchCurrentLocation(playthroughId);
      fetchAllLocations(playthroughId);
    }
  }, [playthroughId, fetchCurrentLocation, fetchAllLocations]);

  // Group locations by region
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

  const handleToggleLocation = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Loading state
  if (isLoading && !currentContext && playthroughLocations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <Loader2 size={40} className="animate-spin" />
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Compass size={28} className="text-accent-400" />
          <h1 className="text-2xl sm:text-3xl font-display text-ink-100">{t.map.title}</h1>
        </div>
        <p className="text-ink-200/60 mt-2 text-sm">
          {t.map.subtitle}
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
      </div>

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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
