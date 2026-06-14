import { useTranslation } from '../../i18n';

interface MapViewToggleProps {
  viewMode: 'standard' | '3level';
  onChange: (mode: 'standard' | '3level') => void;
}

export function MapViewToggle({ viewMode, onChange }: MapViewToggleProps) {
  const t = useTranslation();
  return (
    <div
      className="flex items-center bg-ink-800/40 border border-ink-700/50 p-1 rounded-xl backdrop-blur-sm shrink-0 w-full md:w-auto"
      role="tablist"
      aria-label={t.layout?.mapViewMode ?? 'Map view mode'}
    >
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'standard'}
        onClick={() => onChange('standard')}
        className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
          viewMode === 'standard'
            ? 'bg-accent-600 text-white shadow-md shadow-accent-600/20'
            : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/30'
        }`}
      >
        {t.map.standardView}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === '3level'}
        onClick={() => onChange('3level')}
        className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
          viewMode === '3level'
            ? 'bg-accent-600 text-white shadow-md shadow-accent-600/20'
            : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/30'
        }`}
      >
        {t.map.threeLevelMap}
      </button>
    </div>
  );
}
