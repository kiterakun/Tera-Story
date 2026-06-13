import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ItemCard } from '../../design-system/ItemCard';

describe('ItemCard primitive', () => {
  const baseItem = {
    _id: 'i1',
    name: 'Moon Blade',
    rarity: 'legendary',
    status: 'active',
    description: 'A blade forged under a moon.',
    imageUrl: '/moon.png',
  };

  it('renders item name and rarity badge', () => {
    render(<ItemCard item={baseItem} rarityLabel="Huyền thoại" />);
    expect(screen.getByText('Moon Blade')).toBeInTheDocument();
    expect(screen.getByText('Huyền thoại')).toBeInTheDocument();
  });

  it('shows status when not active', () => {
    render(<ItemCard item={{ ...baseItem, status: 'destroyed' }} statusLabel="Phá hủy" />);
    expect(screen.getByText('Phá hủy')).toBeInTheDocument();
  });

  it('calls onOpen with the item id when clicked', () => {
    const onOpen = vi.fn();
    render(<ItemCard item={baseItem} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /Moon Blade/ }));
    expect(onOpen).toHaveBeenCalledWith('i1');
  });
});
