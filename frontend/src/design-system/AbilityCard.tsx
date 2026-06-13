import type { ComponentProps } from 'react';
import { EntityCard } from './EntityCard';

type EntityCardProps = ComponentProps<typeof EntityCard>;

export interface AbilityCardProps extends Omit<EntityCardProps, 'variant' | 'name' | 'rarity' | 'status' | 'subtitle'> {
  ability: { _id: string; name: string; category: string; rarity: string; status: string; imageUrl?: string; description?: string };
  rarityLabel?: string;
  statusLabel?: string;
  onOpen?: (id: string) => void;
}

export function AbilityCard({ ability, rarityLabel, statusLabel, onOpen, className, ...rest }: AbilityCardProps) {
  return (
    <EntityCard
      variant="special-item"
      name={ability.name}
      subtitle={ability.category}
      rarity={ability.rarity}
      rarityLabel={rarityLabel}
      status={ability.status !== 'active' ? ability.status : undefined}
      statusLabel={ability.status !== 'active' ? statusLabel : undefined}
      description={ability.description}
      imageUrl={ability.imageUrl}
      imageAlt={ability.name}
      onClick={onOpen ? () => onOpen(ability._id) : undefined}
      className={className}
      {...rest}
    />
  );
}
