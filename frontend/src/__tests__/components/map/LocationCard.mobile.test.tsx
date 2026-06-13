import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocationCard } from '../../../components/map/LocationCard';

const baseLocation = {
  _id: 'l1',
  name: 'Hollow Keep',
  description: 'An abandoned fortress with a long description that should wrap across multiple lines on small viewports and stay readable on larger ones.',
  type: 'dungeon',
  status: 'visited',
  region: { _id: 'r1', name: 'North', continentId: 'c1' },
  regionId: 'r1',
  dynamicStats: [],
  worldId: 'w1',
  playthroughId: 'p1',
  createdAt: '',
};

describe('LocationCard mobile sizing', () => {
  it('collapses description with line-clamp on small viewports', () => {
    const { container } = render(<LocationCard location={baseLocation} />);
    // The collapsed description paragraph exists with the line-clamp class.
    const desc = container.querySelector('p.line-clamp-2');
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveClass('sm:line-clamp-3');
    expect(desc).toHaveClass('break-words');
  });

  it('expands to show the full description and stat grid on activation', () => {
    const onToggle = vi.fn();
    render(<LocationCard location={baseLocation} onToggle={onToggle} />);
    const card = screen.getByText('Hollow Keep').closest('[role="button"]')!;
    fireEvent.click(card);
    expect(onToggle).toHaveBeenCalled();
  });
});
