import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AbilityCard } from '../../design-system/AbilityCard';

describe('AbilityCard primitive', () => {
  const baseAbility = {
    _id: 'a1',
    name: 'Sealed Oath',
    category: 'Relic',
    rarity: 'rare',
    status: 'active',
    description: 'A bound promise.',
  };

  it('renders ability name, category, and rarity', () => {
    render(<AbilityCard ability={baseAbility} rarityLabel="Hiếm" />);
    expect(screen.getByText('Sealed Oath')).toBeInTheDocument();
    expect(screen.getByText('Relic')).toBeInTheDocument();
    expect(screen.getByText('Hiếm')).toBeInTheDocument();
  });

  it('shows status when not active', () => {
    render(<AbilityCard ability={{ ...baseAbility, status: 'sealed' }} statusLabel="Phong ấn" />);
    expect(screen.getByText('Phong ấn')).toBeInTheDocument();
  });

  it('calls onOpen with the ability id when clicked', () => {
    const onOpen = vi.fn();
    render(<AbilityCard ability={baseAbility} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /Sealed Oath/ }));
    expect(onOpen).toHaveBeenCalledWith('a1');
  });
});
