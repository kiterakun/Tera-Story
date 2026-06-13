import { Mountain } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { LocationCard } from './LocationCard';
import type { Location } from '../../services/mapApi';
import type { ResourceTemplate } from '@/types/entities';

interface RegionGroupProps {
  regionName: string;
  continentName?: string;
  locations: Location[];
  currentLocationId?: string;
  expandedId?: string | null;
  onToggleLocation?: (id: string) => void;
  templates?: ResourceTemplate[];
}

export function RegionGroup({
  regionName,
  continentName,
  locations,
  currentLocationId,
  expandedId,
  onToggleLocation,
  templates,
}: RegionGroupProps) {
  const t = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Mountain size={14} className="text-ink-400" aria-hidden="true" />
        <h3 className="font-display text-ink-200 text-sm">{regionName}</h3>
        {continentName && <span className="text-xs text-ink-400">({continentName})</span>}
        <span className="text-xs text-ink-500 ml-auto">
          {t.map.locationsCount.replace('{count}', String(locations.length))}
        </span>
      </div>
      <div className="space-y-2 pl-4 border-l-2 border-ink-800">
        {locations.map((loc) => (
          <LocationCard
            key={loc._id}
            location={loc}
            isCurrent={loc._id === currentLocationId}
            isExpanded={expandedId === loc._id}
            onToggle={onToggleLocation ? () => onToggleLocation(loc._id) : undefined}
            templates={templates}
          />
        ))}
      </div>
    </div>
  );
}
