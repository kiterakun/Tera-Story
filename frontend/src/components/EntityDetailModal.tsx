import { X, UserRound, Package, Sparkles, Crown } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { Character, Item, SpecialItem, ItemRarity } from '../services/playthroughApi';
import { getImageUrl } from '../utils/url';

type EntityData =
  | { type: 'character'; data: Character }
  | { type: 'item'; data: Item }
  | { type: 'special'; data: SpecialItem };

interface EntityDetailModalProps {
  entity: EntityData | null;
  onClose: () => void;
}

const RARITY_CONFIG: Record<ItemRarity, { border: string; bg: string; text: string; glow: string; icon: string }> = {
  common: { border: 'border-gray-500/40', bg: 'bg-gray-500/5', text: 'text-gray-300', glow: '', icon: '○' },
  uncommon: { border: 'border-green-500/40', bg: 'bg-green-500/5', text: 'text-green-400', glow: '', icon: '◇' },
  rare: { border: 'border-blue-500/40', bg: 'bg-blue-500/5', text: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]', icon: '◆' },
  epic: { border: 'border-purple-500/40', bg: 'bg-purple-500/5', text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.2)]', icon: '★' },
  legendary: { border: 'border-amber-500/40', bg: 'bg-amber-500/5', text: 'text-amber-400', glow: 'shadow-[0_0_25px_rgba(251,191,36,0.25)]', icon: '✦' },
};

export function EntityDetailModal({ entity, onClose }: EntityDetailModalProps) {
  const t = useTranslation();
  if (!entity) return null;

  const renderCharacter = (char: Character) => {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          {char.imageUrl ? (
            <img src={getImageUrl(char.imageUrl)} alt={char.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-accent-400/30" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-ink-700/50 border border-ink-600 flex items-center justify-center">
              <UserRound size={32} className="text-ink-200/60" />
            </div>
          )}
          <div>
            <h3 className="font-display text-xl text-ink-100">{char.name}</h3>
            <span className="text-xs text-accent-400 uppercase tracking-wide font-medium">
              {char.role === 'protagonist' ? t.characterPanel.protagonist : 'NPC'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-ink-200/80 text-sm leading-relaxed">{char.description}</p>

        {/* Stats */}
        {char.dynamicStats.length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.storyReader.statsTab}</h4>
            <div className="space-y-2">
              {char.dynamicStats.map(stat => (
                <div key={stat.k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-200/70">{stat.k}</span>
                    <span className="text-ink-100 font-mono">{String(stat.v)}</span>
                  </div>
                  {stat.t === 'progress' && (
                    <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-600 to-accent-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Number(stat.v))}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderItem = (item: Item) => {
    const rc = RARITY_CONFIG[item.rarity];
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          {item.imageUrl ? (
            <img src={getImageUrl(item.imageUrl)} alt={item.name} className={`w-20 h-20 rounded-2xl object-cover border-2 ${rc.border}`} />
          ) : (
            <div className={`w-20 h-20 rounded-2xl bg-ink-700/50 border ${rc.border} flex items-center justify-center`}>
              <Package size={32} className="text-ink-200/60" />
            </div>
          )}
          <div>
            <h3 className="font-display text-xl text-ink-100">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs uppercase tracking-wide font-bold ${rc.text}`}>
                {rc.icon} {t.rarity[item.rarity]}
              </span>
            </div>
          </div>
        </div>
        <p className="text-ink-200/80 text-sm leading-relaxed">{item.description}</p>
        {Object.keys(item.properties || {}).length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.itemDetail.properties}</h4>
            <div className="space-y-1.5">
              {Object.entries(item.properties).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-ink-200/70">{key}</span>
                  <span className="text-ink-100 font-mono">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSpecialItem = (si: SpecialItem) => {
    const rc = RARITY_CONFIG[si.rarity];
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          {si.imageUrl ? (
            <img src={getImageUrl(si.imageUrl)} alt={si.name} className={`w-20 h-20 rounded-2xl object-cover border-2 ${rc.border}`} />
          ) : (
            <div className={`w-20 h-20 rounded-2xl bg-purple-900/30 border ${rc.border} flex items-center justify-center`}>
              <Sparkles size={32} className="text-purple-400/60" />
            </div>
          )}
          <div>
            <h3 className="font-display text-xl text-ink-100">{si.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-purple-400/80 bg-purple-400/10 px-2 py-0.5 rounded">{si.category}</span>
              <span className={`text-xs uppercase tracking-wide font-bold ${rc.text}`}>
                {rc.icon} {t.rarity[si.rarity]}
              </span>
            </div>
          </div>
        </div>
        <p className="text-ink-200/80 text-sm leading-relaxed">{si.description}</p>
        {Object.keys(si.customFields || {}).length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.itemDetail.properties}</h4>
            <div className="space-y-1.5">
              {Object.entries(si.customFields).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-ink-200/70">{key}</span>
                  <span className="text-ink-100 font-mono">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const rarity = entity.type === 'item' ? entity.data.rarity
    : entity.type === 'special' ? entity.data.rarity : null;
  const rc = rarity ? RARITY_CONFIG[rarity] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-lg bg-ink-900 border rounded-3xl p-6 max-h-[85vh] overflow-y-auto ${rc ? `${rc.border} ${rc.glow}` : 'border-ink-700'}`}>
        {/* Rarity shimmer for epic/legendary */}
        {rarity === 'legendary' && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-pulse" />
          </div>
        )}
        {rarity === 'epic' && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5 animate-pulse" />
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors z-10"
        >
          <X size={16} />
        </button>

        <div className="relative">
          {entity.type === 'character' && renderCharacter(entity.data)}
          {entity.type === 'item' && renderItem(entity.data)}
          {entity.type === 'special' && renderSpecialItem(entity.data)}
        </div>
      </div>
    </div>
  );
}

export type { EntityData };
