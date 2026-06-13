import { useTranslation } from '../../i18n';
import { LOCATION_TYPE_COLORS } from './location-constants';

const LOCATION_TYPE_LABEL_KEYS: Record<string, string> = {
  town: 'town',
  dungeon: 'dungeon',
  wilderness: 'wilderness',
  ruin: 'ruin',
  sanctuary: 'sanctuary',
  crossroad: 'crossroad',
};

export function MapLegend() {
  const t = useTranslation();
  const types = Object.keys(LOCATION_TYPE_COLORS);
  return (
    <div
      className="bg-ink-900/80 backdrop-blur-md border border-ink-800 p-3 rounded-xl shadow-lg"
      role="region"
      aria-label={t.map?.legendLabel ?? 'Map legend'}
    >
      <h4 className="text-xs font-semibold text-ink-300 mb-2 uppercase tracking-wider">
        {t.map?.legendLabel ?? 'Legend'}
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {types.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${LOCATION_TYPE_COLORS[key]?.replace('text-', 'bg-') ?? 'bg-ink-500'}`} aria-hidden="true" />
            <span className="text-[10px] text-ink-200 capitalize">
              {(t.map.types as Record<string, string> | undefined)?.[key] ??
                LOCATION_TYPE_LABEL_KEYS[key] ??
                key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
