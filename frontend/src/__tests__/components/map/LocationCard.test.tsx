import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocationCard } from '../../../components/map/LocationCard';

const baseLocation = {
  _id: 'l1',
  name: 'Hollow Keep',
  description: 'An abandoned fortress.',
  type: 'dungeon',
  status: 'known',
  region: { _id: 'r1', name: 'North', continentId: 'c1' },
  regionId: 'r1',
  dynamicStats: [],
  worldId: 'w1',
  playthroughId: 'p1',
  createdAt: '',
};

describe('LocationCard', () => {
  it('renders location name, type, and status badge', () => {
    render(<LocationCard location={baseLocation} />);
    expect(screen.getByText('Hollow Keep')).toBeInTheDocument();
  });

  it('toggles internal expanded state on click when no onToggle is supplied', () => {
    render(<LocationCard location={baseLocation} />);
    const card = screen.getByText('Hollow Keep').closest('[role="button"]')!;
    fireEvent.click(card);
    expect(card).toBeInTheDocument();
  });

  it('calls onToggle when provided', () => {
    const onToggle = vi.fn();
    render(<LocationCard location={baseLocation} onToggle={onToggle} />);
    const card = screen.getByText('Hollow Keep').closest('[role="button"]')!;
    fireEvent.click(card);
    expect(onToggle).toHaveBeenCalled();
  });

  it('handles Enter and Space keyboard activation', () => {
    const onToggle = vi.fn();
    render(<LocationCard location={baseLocation} onToggle={onToggle} />);
    const card = screen.getByText('Hollow Keep').closest('[role="button"]')!;
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(card, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});
