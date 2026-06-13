import { useState } from 'react';
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { DynamicStatList } from '../DynamicStatDisplay';
import type { Location } from '../../services/mapApi';
import type { ResourceTemplate } from '@/types/entities';
import {
  LOCATION_TYPE_ICONS,
  LOCATION_TYPE_COLORS,
  LOCATION_TYPE_BG,
  LOCATION_STATUS_BADGES,
} from './location-constants';

interface LocationCardProps {
  location: Location;
  isCurrent?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  templates?: ResourceTemplate[];
}

export function LocationCard({ location, isCurrent, isExpanded, onToggle, templates }: LocationCardProps) {
  const t = useTranslation();
  const Icon = LOCATION_TYPE_ICONS[location.type] || MapPin;
  const colorClass = LOCATION_TYPE_COLORS[location.type] || 'text-stone-400';
  const bgClass = LOCATION_TYPE_BG[location.type] || 'bg-stone-800/50 border-stone-600/50';
  const statusInfo = LOCATION_STATUS_BADGES[location.status] || LOCATION_STATUS_BADGES.undiscovered!;
  const statusLabel = t.map.status[statusInfo.labelKey as keyof typeof t.map.status];
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = isExpanded ?? internalExpanded;
  const handleClick = () => {
    if (onToggle) onToggle();
    else setInternalExpanded((prev) => !prev);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isCurrent
          ? 'border-accent-500/60 bg-accent-900/20 shadow-lg shadow-accent-900/20'
          : bgClass
      } ${onToggle || !isExpanded ? 'cursor-pointer hover:border-ink-600' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${colorClass}`}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-ink-100 text-base">{location.name}</h3>
            {isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-600/30 text-accent-300 border border-accent-500/40">
                {t.map.currentBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs ${colorClass}`}>
              {t.map.types[location.type as keyof typeof t.map.types] || location.type}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.className}`}>
              {statusLabel}
            </span>
          </div>
          {expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-ink-200/80 leading-relaxed">{location.description}</p>
              {location.dynamicStats && location.dynamicStats.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {location.dynamicStats.map((stat, idx) => (
                    <div key={idx} className="bg-ink-950/50 rounded-lg px-2 py-1">
                      <DynamicStatList stats={[stat]} templates={templates} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!expanded && location.description && (
            <p className="text-sm text-ink-200/60 mt-1 line-clamp-2">{location.description}</p>
          )}
        </div>
        <div className="text-ink-400 shrink-0">
          {expanded ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
