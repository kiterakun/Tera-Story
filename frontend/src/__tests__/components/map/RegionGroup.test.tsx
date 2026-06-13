import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RegionGroup } from '../../../components/map/RegionGroup';

const locations = [
  { _id: 'l1', name: 'Hollow Keep', description: 'x', type: 'dungeon', status: 'known', region: { _id: 'r1', name: 'North', continentId: 'c1' }, regionId: 'r1', dynamicStats: [], worldId: 'w1', playthroughId: 'p1', createdAt: '' },
  { _id: 'l2', name: 'Greenhold', description: 'y', type: 'town', status: 'visited', region: { _id: 'r1', name: 'North', continentId: 'c1' }, regionId: 'r1', dynamicStats: [], worldId: 'w1', playthroughId: 'p1', createdAt: '' },
];

describe('RegionGroup', () => {
  it('renders region name and a location count', () => {
    render(<RegionGroup regionName="North" continentName="Eldoria" locations={locations} />);
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('(Eldoria)')).toBeInTheDocument();
    expect(screen.getByText('Hollow Keep')).toBeInTheDocument();
    expect(screen.getByText('Greenhold')).toBeInTheDocument();
  });

  it('invokes onToggleLocation with the location id', () => {
    const onToggleLocation = vi.fn();
    render(<RegionGroup regionName="North" locations={locations} onToggleLocation={onToggleLocation} />);
    fireEvent.click(screen.getByText('Hollow Keep').closest('[role="button"]')!);
    expect(onToggleLocation).toHaveBeenCalledWith('l1');
  });
});
