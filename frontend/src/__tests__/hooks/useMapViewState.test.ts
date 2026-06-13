import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMapViewState } from '../../hooks/useMapViewState';

vi.mock('../../services/mapApi', () => ({
  getWorldMap: vi.fn().mockResolvedValue({
    continents: [
      {
        _id: 'c1',
        name: 'Eldoria',
        description: 'A crystalline land.',
        climate: 'Temperate',
        dominantCulture: 'High Elves',
        terrainType: 'Mixed',
        regions: [
          {
            _id: 'r1',
            name: 'Silverleaf',
            description: 'A forest.',
            terrainType: 'Forest',
            dangerLevel: 2,
            resources: ['silver'],
          },
        ],
      },
    ],
    regions: [],
    locations: [],
  }),
}));

vi.mock('../../hooks/useMap', () => ({
  useMap: () => ({
    currentContext: null,
    playthroughLocations: [],
    isLoading: false,
    error: null,
    fetchCurrentLocation: vi.fn(),
    fetchAllLocations: vi.fn(),
  }),
}));

vi.mock('../../stores/storyStore', () => ({
  useStoryStore: () => ({ world: { _id: 'w1' } }),
}));

describe('useMapViewState', () => {
  it('exposes the initial view mode and locationsByRegion empty array', () => {
    const { result } = renderHook(() => useMapViewState({ playthroughId: 'p1' }));
    expect(result.current.viewMode).toBe('standard');
    expect(result.current.locationsByRegion).toEqual([]);
    expect(result.current.hierarchicalData).toEqual([]);
  });

  it('toggles view mode via setViewMode', () => {
    const { result } = renderHook(() => useMapViewState({ playthroughId: 'p1' }));
    act(() => result.current.setViewMode('3level'));
    expect(result.current.viewMode).toBe('3level');
  });

  it('fetches world map data on mount and exposes it', async () => {
    const { result } = renderHook(() => useMapViewState({ worldId: 'w1' }));
    await waitFor(() => expect(result.current.mapData).not.toBeNull(), { timeout: 3000 });
    expect(result.current.mapData?.continents?.[0]?.name).toBe('Eldoria');
  });
});
