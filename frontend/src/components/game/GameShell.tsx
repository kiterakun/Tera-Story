import {
  X,
  UserRound,
  Users,
  Network,
  MapPin,
  Package,
  Sparkles,
  Archive,
  Landmark,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { useTranslation } from '../../i18n';

export type GameTab =
  | 'character'
  | 'companions'
  | 'relationships'
  | 'map'
  | 'inventory'
  | 'abilities'
  | 'organizations'
  | 'archive';

const TABS: { id: GameTab; icon: typeof UserRound; labelKey: string }[] = [
  { id: 'character', icon: UserRound, labelKey: 'protagonist' },
  { id: 'companions', icon: Users, labelKey: 'companions' },
  { id: 'relationships', icon: Network, labelKey: 'relationships' },
  { id: 'map', icon: MapPin, labelKey: 'map' },
  { id: 'inventory', icon: Package, labelKey: 'inventory' },
  { id: 'abilities', icon: Sparkles, labelKey: 'specialItems' },
  { id: 'organizations', icon: Landmark, labelKey: 'organizations' },
  { id: 'archive', icon: Archive, labelKey: 'archive' },
];

interface GameShellProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>;
  children: ReactNode;
}

export function GameShell({ activeTab, onTabChange, onClose, t, children }: GameShellProps) {
  const getTabLabel = (tab: (typeof TABS)[number]) => {
    const key = tab.labelKey as keyof typeof t.characterPanel;
    return t.characterPanel[key] || tab.labelKey;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={t.playthrough.gameMenu}>
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-ink-900 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-auto max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-ink-700 shrink-0">
          <h2 className="font-display text-base sm:text-lg text-ink-100">{t.playthrough.gameMenu}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-ink-700 bg-ink-900/50 p-2 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-1.5 md:gap-0 scrollbar-none" role="tablist" aria-label="Game tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} role="tab" aria-selected={isActive} aria-controls={`panel-${tab.id}`} onClick={() => onTabChange(tab.id)} className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors shrink-0 md:w-full ${isActive ? 'bg-accent-600/10 text-accent-400 border border-accent-600/20' : 'text-ink-200/70 hover:text-ink-100 hover:bg-ink-800/50'}`}>
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{getTabLabel(tab)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6" role="tabpanel" id={`panel-${activeTab}`} aria-label={activeTab}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
