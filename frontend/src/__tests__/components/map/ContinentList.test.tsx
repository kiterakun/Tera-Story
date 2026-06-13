import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ContinentList } from '../../../components/map/ContinentList';
import type { MapData } from '../../../services/mapApi';

vi.mock('../../../hooks/useMap', () => ({
  useMap: () => ({
    currentContext: null,
    playthroughLocations: [],
    isLoading: false,
    error: null,
    fetchCurrentLocation: vi.fn(),
    fetchAllLocations: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useMapViewState', () => ({
  useMapViewState: () => ({
    mapData: null,
    isLoadingMap: false,
    mapError: null,
    handleRetryMap: vi.fn(),
  }),
}));

const baseMapData: MapData = {
  continents: [
    {
      _id: 'c1',
      name: 'Eldoria',
      description: 'A crystalline land of magic.',
      climate: 'Temperate',
      dominantCulture: 'High Elves',
      terrainType: 'Mixed',
      regions: [
        {
          _id: 'r1',
          name: 'Silverleaf',
          description: 'A forest of silver trees.',
          terrainType: 'Forest',
          dangerLevel: 2,
          resources: ['silver', 'moonstone'],
        },
      ],
    },
  ],
  regions: [],
  locations: [],
} as unknown as MapData;

describe('ContinentList', () => {
  it('renders continents and their regions', () => {
    render(<ContinentList mapData={baseMapData} />);
    expect(screen.getByRole('heading', { name: 'Eldoria' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Silverleaf' })).toBeInTheDocument();
  });

  it('renders the empty state when no continents are available', () => {
    render(<ContinentList mapData={{ continents: [], regions: [], locations: [] } as unknown as MapData} />);
    expect(screen.getByText(/Không tìm thấy dữ liệu địa lý lục địa/)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ContinentList mapData={baseMapData} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
