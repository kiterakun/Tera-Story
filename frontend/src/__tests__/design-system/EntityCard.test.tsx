import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EntityCard } from '../../design-system/EntityCard';

describe('EntityCard primitive', () => {
  it('renders character variant with default character icon and status badge', () => {
    render(
      <EntityCard
        variant="character"
        name="Linh"
        subtitle="Protagonist"
        description="A careful scout."
        status="active"
      />,
    );

    expect(screen.getByRole('button', { name: 'Linh, Protagonist' })).toBeInTheDocument();
    expect(screen.getByText('Linh')).toBeInTheDocument();
    expect(screen.getByText('Protagonist')).toBeInTheDocument();
    expect(screen.getByText('active')).toHaveClass('text-green-400', 'bg-green-500/10');
  });

  it('renders item variant with rarity badge from Badge primitive', () => {
    render(
      <EntityCard
        variant="item"
        name="Moon Blade"
        subtitle="Weapon"
        rarity="legendary"
        status="active"
      />,
    );

    expect(screen.getByText('legendary')).toHaveClass('text-amber-400', 'bg-amber-500/10');
    expect(screen.getByText('active')).toHaveClass('text-green-400', 'bg-green-500/10');
  });

  it('renders special-item variant with special status mapping', () => {
    render(
      <EntityCard
        variant="special-item"
        name="Sealed Oath"
        subtitle="Relic"
        rarity="rare"
        status="sealed"
      />,
    );

    expect(screen.getByText('rare')).toHaveClass('text-blue-400');
    expect(screen.getByText('sealed')).toHaveClass('text-red-400', 'bg-red-500/10');
  });

  it('renders organization variant with organization status mapping', () => {
    render(
      <EntityCard
        variant="organization"
        name="Hidden Gate"
        subtitle="Faction"
        status="hidden"
      />,
    );

    expect(screen.getByText('hidden')).toHaveClass('text-amber-400', 'bg-amber-500/10');
  });

  it('renders image when imageUrl is provided', () => {
    render(
      <EntityCard
        variant="character"
        name="Mai"
        imageUrl="/characters/mai.png"
        imageAlt="Portrait of Mai"
      />,
    );

    const img = screen.getByRole('img', { name: 'Portrait of Mai' });
    expect(img).toHaveAttribute('src', '/characters/mai.png');
  });

  it('calls onClick for interactive cards', () => {
    const onClick = vi.fn();
    render(<EntityCard variant="item" name="Lantern" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Lantern' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks selected cards with aria-pressed and selected classes', () => {
    render(<EntityCard variant="character" name="Selected Hero" selected />);

    const card = screen.getByRole('button', { name: 'Selected Hero' });
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card).toHaveClass('border-accent-500', 'bg-accent-500/10');
  });

  it('disables cards and suppresses click callbacks', () => {
    const onClick = vi.fn();
    render(<EntityCard variant="organization" name="Archived Guild" disabled onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'Archived Guild' });
    fireEvent.click(card);

    expect(card).toBeDisabled();
    expect(card).toHaveClass('cursor-not-allowed', 'opacity-40');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders custom meta and child content', () => {
    render(
      <EntityCard variant="item" name="Satchel" meta="3 uses left">
        <span data-testid="custom-child">Equipped</span>
      </EntityCard>,
    );

    expect(screen.getByText('3 uses left')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Equipped');
  });

  it('accepts custom aria-label', () => {
    render(<EntityCard variant="special-item" name="Crown" aria-label="Open Crown details" />);

    expect(screen.getByRole('button', { name: 'Open Crown details' })).toBeInTheDocument();
  });
});
