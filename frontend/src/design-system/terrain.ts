/**
 * Terrain color map — used by MapSelectionStep and world-map visualizations.
 *
 * Centralized here so hex literals don't leak into React components.
 * Phase 6 may move this to theme-aware CSS variables if we need per-theme
 * terrain palettes (would require `getComputedStyle` reads at render time).
 */

export type TerrainType =
  | 'forest'
  | 'mountain'
  | 'desert'
  | 'ocean'
  | 'plains'
  | 'swamp'
  | 'tundra'
  | 'volcanic'
  | 'urban'
  | 'default';

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  forest:   '#22c55e', // green
  mountain: '#78716c', // stone
  desert:   '#fbbf24', // amber
  ocean:    '#3b82f6', // blue
  plains:   '#84cc16', // lime
  swamp:    '#059669', // emerald
  tundra:   '#94a3b8', // slate
  volcanic: '#dc2626', // red
  urban:    '#6b7280', // gray
  default:  '#64748b', // slate-500
};

/**
 * Resolve a terrain color by name, falling back to `default`.
 * Use this in inline-style render sites where Tailwind class lookups aren't viable.
 */
export function getTerrainColor(terrain: string | undefined | null): string {
  if (!terrain) return TERRAIN_COLORS.default;
  return TERRAIN_COLORS[terrain as TerrainType] ?? TERRAIN_COLORS.default;
}
