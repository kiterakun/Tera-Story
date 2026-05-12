import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { useParams } from 'react-router-dom';
import { useMap } from '../hooks/useMap';
import type { Region, Location } from '../services/mapApi';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Map,
  Navigation,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Constants ──────────────────────────────────────────────────────────

const VIEWBOX_SIZE = 1000;

const TERRAIN_COLORS: Record<string, string> = {
  plains: '#90EE90',
  forest: '#228B22',
  mountain: '#8B4513',
  desert: '#F4A460',
  coastal: '#87CEEB',
  tundra: '#E0E0E0',
  volcanic: '#FF4500',
  swamp: '#556B2F',
  jungle: '#006400',
  grassland: '#7CFC00',
};

const LOCATION_COLORS: Record<string, string> = {
  town: '#FFD700',
  dungeon: '#8B0000',
  wilderness: '#228B22',
  ruin: '#808080',
  sanctuary: '#4169E1',
  crossroad: '#DAA520',
};

const LOCATION_RADII: Record<string, number> = {
  town: 14,
  dungeon: 12,
  wilderness: 10,
  ruin: 11,
  sanctuary: 15,
  crossroad: 8,
};

const CONTINENT_RADIUS = 70;

const TERRAIN_LABELS: Record<string, string> = {
  plains: 'Plains',
  forest: 'Forest',
  mountain: 'Mountain',
  desert: 'Desert',
  coastal: 'Coastal',
  tundra: 'Tundra',
  volcanic: 'Volcanic',
  swamp: 'Swamp',
  jungle: 'Jungle',
  grassland: 'Grassland',
};

// ── Helpers ──────────────────────────────────────────────────────────

function terrainColor(type: string): string {
  return TERRAIN_COLORS[type] ?? '#555555';
}

function locationColor(type: string): string {
  return LOCATION_COLORS[type] ?? '#AAAAAA';
}

function locationRadius(type: string): number {
  return LOCATION_RADII[type] ?? 10;
}

function computeVoronoiCells(
  regions: Region[],
  width: number,
  height: number,
): { region: Region; pathD: string }[] {
  if (regions.length === 0) return [];
  const points: [number, number][] = regions.map((r) => [r.position.x, r.position.y]);
  const delaunay = d3.Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);
  return regions.map((r, i) => ({
    region: r,
    pathD: voronoi.renderCell(i),
  }));
}

function computeLocationEdges(
  locations: Location[],
): { source: [number, number]; target: [number, number]; key: string }[] {
  const locMap = new Map<string, Location>(locations.map((l) => [l._id, l]));
  const edgeSet = new Set<string>();
  const edges: { source: [number, number]; target: [number, number]; key: string }[] = [];
  for (const loc of locations) {
    for (const connId of loc.connectedLocations) {
      const conn = locMap.get(connId);
      if (!conn) continue;
      const key = [loc._id, connId].sort().join('-');
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push({
        source: [loc.position.x, loc.position.y],
        target: [conn.position.x, conn.position.y],
        key,
      });
    }
  }
  return edges;
}

const ZOOM_LEVEL_LABELS: Record<number, string> = { 1: 'World', 2: 'Region', 3: 'Local' };

// ── Sub-components ────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-stone-900">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <Loader2 size={40} className="animate-spin" />
        <p className="text-sm">Loading map data…</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-stone-900 text-stone-300">
      <Map size={48} className="text-red-400" />
      <p className="text-sm text-red-400">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
}

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span className="text-stone-300">{label}</span>
    </div>
  );
}

interface LocationPanelProps {
  location: Location;
  onClose: () => void;
  onTravel: () => void;
}

function LocationPanel({ location, onClose, onTravel }: LocationPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-20 w-72 rounded-xl border border-stone-600 bg-stone-800/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-stone-100">{location.name}</h3>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-stone-400 hover:bg-stone-700 hover:text-stone-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: locationColor(location.type) }}
        />
        <span className="text-xs capitalize text-stone-400">{location.type}</span>
        <span className="ml-auto rounded bg-stone-700 px-1.5 py-0.5 text-[10px] text-stone-300">
          {location.status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-stone-400 line-clamp-4">
        {location.description}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onTravel}
          className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-500 transition-colors"
        >
          <Navigation size={14} />
          Travel
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-stone-600 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function MapPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const {
    continents,
    regions,
    locations,
    currentZoom,
    selectedContinent,
    selectedRegion,
    selectedLocation,
    isLoading,
    error,
    fetchMap,
    zoomToContinent,
    zoomToRegion,
    selectLocation,
    travel,
    zoomOut,
    resetView,
  } = useMap();

  const svgRef = useRef<SVGSVGElement>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);
  const initialisedRef = useRef(false);

  // Initial fetch
  useEffect(() => {
    if (worldId && !initialisedRef.current) {
      initialisedRef.current = true;
      fetchMap(worldId);
    }
  }, [worldId, fetchMap]);

  // d3-zoom setup
  useEffect(() => {
    if (!svgRef.current || !zoomGroupRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        d3.select(zoomGroupRef.current).attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  // Voronoi cells — recomputed when regions change
  const voronoiCells = useMemo(
    () => computeVoronoiCells(regions, VIEWBOX_SIZE, VIEWBOX_SIZE),
    [regions],
  );

  const locationEdges = useMemo(() => computeLocationEdges(locations), [locations]);

  // Handlers
  const handleZoomToContinent = useCallback(
    (continentId: string) => {
      if (!worldId) return;
      zoomToContinent(worldId, continentId);
    },
    [worldId, zoomToContinent],
  );

  const handleZoomToRegion = useCallback(
    (regionId: string) => {
      if (!worldId) return;
      // Pass current region as the playthrough context — the backend uses playthroughId
      // For now we pass the regionId as both. The actual playthroughId should come from
      // the playthrough context in a full implementation.
      zoomToRegion(worldId, regionId, 'current');
    },
    [worldId, zoomToRegion],
  );

  const handleTravel = useCallback(async () => {
    if (!selectedLocation || !worldId) return;
    const result = await travel(worldId, selectedLocation._id, 'current');
    if (result) {
      toast.success(`Arrived at ${selectedLocation.name}`);
    }
  }, [selectedLocation, worldId, travel]);

  const handleResetView = useCallback(() => {
    resetView();
  }, [resetView]);

  // All unique terrain types in current view
  const terrainTypes = useMemo(() => {
    if (currentZoom === 1) {
      return [...new Set(continents.map((c) => c.terrainType))].filter(Boolean);
    }
    if (currentZoom === 2) {
      return [...new Set(regions.map((r) => r.terrainType))].filter(Boolean);
    }
    return [];
  }, [currentZoom, continents, regions]);

  // Render states
  if (!worldId) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-900 text-stone-300">
        <p>No world selected.</p>
      </div>
    );
  }

  if (error && continents.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchMap(worldId)} />;
  }

  if (isLoading && continents.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-stone-900">
      {/* Map Controls — top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex rounded-lg border border-stone-600 bg-stone-800/90 overflow-hidden">
          <button
            onClick={zoomOut}
            disabled={currentZoom === 1}
            className="p-2 text-stone-300 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="flex items-center px-3 text-xs font-medium text-stone-300 border-x border-stone-600">
            {ZOOM_LEVEL_LABELS[currentZoom]}
          </span>
          <button
            onClick={handleResetView}
            className="p-2 text-stone-300 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <span className="rounded bg-stone-800/90 px-2 py-1 text-[10px] font-semibold text-stone-400 border border-stone-600">
          Lv.{currentZoom}
        </span>
      </div>

      {/* Loading indicator for transitions */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-stone-800/90 px-4 py-2 text-xs text-stone-300 border border-stone-600 backdrop-blur">
          <Loader2 size={14} className="inline-block animate-spin mr-2" />
          Loading…
        </div>
      )}

      {/* Legend — bottom-left */}
      {terrainTypes.length > 0 && (currentZoom === 1 || currentZoom === 2) && (
        <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-stone-600 bg-stone-800/90 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Terrain</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {terrainTypes.map((t) => (
              <LegendItem key={t} color={terrainColor(t)} label={TERRAIN_LABELS[t] ?? t} />
            ))}
          </div>
        </div>
      )}

      {/* Location type legend — zoom level 3 */}
      {currentZoom === 3 && (
        <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-stone-600 bg-stone-800/90 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Locations</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(LOCATION_COLORS).map(([type, color]) => (
              <LegendItem key={type} color={color} label={type} />
            ))}
          </div>
        </div>
      )}

      {/* Location Detail Panel */}
      {selectedLocation && (
        <LocationPanel
          location={selectedLocation}
          onClose={() => selectLocation(null)}
          onTravel={handleTravel}
        />
      )}

      {/* SVG Map */}
      <svg
        ref={svgRef}
        className="h-full w-full"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Defs */}
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#292524" />
            <stop offset="100%" stopColor="#1c1917" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#44403c"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>

        {/* Background */}
        <rect width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} fill="url(#bgGrad)" />
        <rect width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} fill="url(#grid)" />

        {/* Zoomable group */}
        <g ref={zoomGroupRef}>
          {/* ── ZOOM LEVEL 1: Continents ── */}
          {currentZoom === 1 &&
            continents.map((c) => (
              <g
                key={c._id}
                className="cursor-pointer"
                onClick={() => handleZoomToContinent(c._id)}
              >
                <circle
                  cx={c.position.x}
                  cy={c.position.y}
                  r={CONTINENT_RADIUS}
                  fill={terrainColor(c.terrainType)}
                  fillOpacity={0.35}
                  stroke={terrainColor(c.terrainType)}
                  strokeWidth={2.5}
                  strokeOpacity={0.7}
                  className="transition-all duration-300 hover:fill-opacity-50 hover:stroke-opacity-100"
                />
                <text
                  x={c.position.x}
                  y={c.position.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-stone-100 text-sm font-bold pointer-events-none select-none"
                  style={{ fontSize: '16px' }}
                >
                  {c.name}
                </text>
                {c.climate && (
                  <text
                    x={c.position.x}
                    y={c.position.y + 18}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-stone-400 text-[10px] pointer-events-none select-none"
                  >
                    {c.climate}
                  </text>
                )}
              </g>
            ))}

          {/* ── ZOOM LEVEL 2: Regions (Voronoi) ── */}
          {currentZoom === 2 &&
            voronoiCells.map(({ region, pathD }) => (
              <g
                key={region._id}
                className="cursor-pointer"
                onClick={() => handleZoomToRegion(region._id)}
              >
                <path
                  d={pathD}
                  fill={terrainColor(region.terrainType)}
                  fillOpacity={0.4}
                  stroke="#78716c"
                  strokeWidth={1.5}
                  className="transition-all duration-200 hover:fill-opacity-60 hover:stroke-stone-300"
                />
                {region.dangerLevel > 0 && (
                  <text
                    x={region.position.x}
                    y={region.position.y - 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-red-400 text-[9px] font-bold pointer-events-none select-none"
                  >
                    {'⚠'.repeat(Math.min(region.dangerLevel, 3))}
                  </text>
                )}
                <text
                  x={region.position.x}
                  y={region.position.y + 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-stone-100 text-[13px] font-semibold pointer-events-none select-none"
                >
                  {region.name}
                </text>
              </g>
            ))}

          {/* ── ZOOM LEVEL 3: Locations ── */}
          {currentZoom === 3 && selectedRegion && (
            <>
              {/* Selected region highlight */}
              <path
                d={
                  voronoiCells.find((v) => v.region._id === selectedRegion._id)
                    ?.pathD ?? ''
                }
                fill={terrainColor(selectedRegion.terrainType)}
                fillOpacity={0.15}
                stroke={terrainColor(selectedRegion.terrainType)}
                strokeWidth={2}
                strokeDasharray="6 3"
              />

              {/* Connection lines */}
              {locationEdges.map((edge) => (
                <line
                  key={edge.key}
                  x1={edge.source[0]}
                  y1={edge.source[1]}
                  x2={edge.target[0]}
                  y2={edge.target[1]}
                  stroke="#78716c"
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                  className="pointer-events-none"
                />
              ))}

              {/* Location nodes */}
              {locations.map((loc) => {
                const r = locationRadius(loc.type);
                const isSelected = selectedLocation?._id === loc._id;
                return (
                  <g
                    key={loc._id}
                    className="cursor-pointer"
                    onClick={() => selectLocation(loc)}
                  >
                    {isSelected && (
                      <circle
                        cx={loc.position.x}
                        cy={loc.position.y}
                        r={r + 6}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={loc.position.x}
                      cy={loc.position.y}
                      r={r}
                      fill={locationColor(loc.type)}
                      fillOpacity={isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#fbbf24' : '#1c1917'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      filter={isSelected ? 'url(#glow)' : undefined}
                      className="transition-all duration-200 hover:fill-opacity-100"
                    />
                    <text
                      x={loc.position.x}
                      y={loc.position.y + r + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-stone-200 text-[10px] font-medium pointer-events-none select-none"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                    >
                      {loc.name}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Empty state for zoom 3 if nothing loaded */}
          {currentZoom === 3 && !selectedRegion && (
            <text
              x={VIEWBOX_SIZE / 2}
              y={VIEWBOX_SIZE / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-stone-500 text-lg"
            >
              Select a region to explore
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
