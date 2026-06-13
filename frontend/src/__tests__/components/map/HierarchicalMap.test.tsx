import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { HierarchicalMap } from '../../../components/map/HierarchicalMap';
import type { Location } from '../../../services/mapApi';

const sampleLocations: Location[] = [
  {
    _id: 'l1',
    name: 'Greenhold',
    description: 'A trade town.',
    type: 'town',
    status: 'visited',
    regionId: 'r1',
    region: { _id: 'r1', name: 'Silverleaf', continentId: 'c1', dangerLevel: 2 },
    dynamicStats: [],
    worldId: 'w1',
    playthroughId: 'p1',
    createdAt: '',
  },
];

const data = [
  {
    continentId: 'c1',
    continentName: 'Eldoria',
    continentDescription: 'A crystalline land.',
    climate: 'Temperate',
    terrainType: 'Mixed',
    regions: [
      {
        regionId: 'r1',
        regionName: 'Silverleaf',
        dangerLevel: 2,
        locations: sampleLocations,
      },
    ],
  },
];

describe('HierarchicalMap', () => {
  it('renders the continent and region headings', () => {
    render(<HierarchicalMap data={data} currentLocationId="l1" />);
    expect(screen.getByRole('heading', { name: 'Eldoria' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Silverleaf' })).toBeInTheDocument();
    expect(screen.getByText('Greenhold')).toBeInTheDocument();
  });

  it('renders the empty state when data is empty', () => {
    render(<HierarchicalMap data={[]} />);
    expect(screen.getByText(/Chưa phát hiện vùng đất nào trong lượt chơi này/)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<HierarchicalMap data={data} currentLocationId="l1" />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
