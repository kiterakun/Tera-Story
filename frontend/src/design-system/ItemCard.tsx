import type { ComponentProps } from 'react';
import { EntityCard } from './EntityCard';

type EntityCardProps = ComponentProps<typeof EntityCard>;

export interface ItemCardProps extends Omit<EntityCardProps, 'variant' | 'name' | 'rarity' | 'status'> {
  item: { _id: string; name: string; rarity: string; status: string; imageUrl?: string; description?: string };
  rarityLabel?: string;
  statusLabel?: string;
  onOpen?: (id: string) => void;
}

export function ItemCard({ item, rarityLabel, statusLabel, onOpen, className, ...rest }: ItemCardProps) {
  return (
    <EntityCard
      variant="item"
      name={item.name}
      rarity={item.rarity}
      rarityLabel={rarityLabel}
      status={item.status !== 'active' ? item.status : undefined}
      statusLabel={item.status !== 'active' ? statusLabel : undefined}
      description={item.description}
      imageUrl={item.imageUrl}
      imageAlt={item.name}
      onClick={onOpen ? () => onOpen(item._id) : undefined}
      className={className}
      {...rest}
    />
  );
}
