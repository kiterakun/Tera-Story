import { X, UserRound, Package, Sparkles, Skull, AlertTriangle, HelpCircle, Landmark } from 'lucide-react';
import { useTranslation } from '../i18n';
import type { Character, Item, SpecialItem, ItemRarity, CharacterStatus, ItemStatus, SpecialItemStatus } from '../services/playthroughApi';
import type { Organization } from '../types/entities';
import { getImageUrl } from '../utils/url';
import { RetryImageButton } from './RetryImageButton';
import { DynamicStatList } from './DynamicStatDisplay';

type EntityData =
  | { type: 'character'; data: Character }
  | { type: 'item'; data: Item }
  | { type: 'special'; data: SpecialItem }
  | { type: 'organization'; data: Organization };

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

const CHARACTER_STATUS_CONFIG: Record<CharacterStatus, { text: string; bg: string; icon: typeof Skull }> = {
  active: { text: 'text-green-400', bg: 'bg-green-500/10', icon: UserRound },
  dead: { text: 'text-red-400', bg: 'bg-red-500/10', icon: Skull },
  injured: { text: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
  missing: { text: 'text-gray-400', bg: 'bg-gray-500/10', icon: HelpCircle },
};

const ITEM_STATUS_CONFIG: Record<ItemStatus, { text: string; bg: string }> = {
  active: { text: 'text-green-400', bg: 'bg-green-500/10' },
  destroyed: { text: 'text-red-400', bg: 'bg-red-500/10' },
  lost: { text: 'text-gray-400', bg: 'bg-gray-500/10' },
  consumed: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const SPECIAL_STATUS_CONFIG: Record<SpecialItemStatus, { text: string; bg: string }> = {
  active: { text: 'text-green-400', bg: 'bg-green-500/10' },
  sealed: { text: 'text-red-400', bg: 'bg-red-500/10' },
  lost: { text: 'text-gray-400', bg: 'bg-gray-500/10' },
  consumed: { text: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export function EntityDetailModal({ entity, onClose }: EntityDetailModalProps) {
  const t = useTranslation();
  const entityStatusLabels: Record<string, string> = t.entityStatus;
  if (!entity) return null;

  // ── Hero image block (shared by all entity types) ───────────────────
  const renderHeroImage = (
    imageUrl: string | undefined,
    alt: string,
    entityType: 'character' | 'item' | 'special-item',
    entityId: string,
    fallbackIcon: React.ReactNode,
    borderClass: string = 'border-ink-700',
  ) => {
    if (imageUrl) {
      // Character: square 1024×1024 → show at max 256px (crisp on 2x displays)
      // Item/Special: square 512–1024 → show at max 192px
      const sizeClass = entityType === 'character'
        ? 'w-64 h-64 max-w-full'
        : 'w-48 h-48 max-w-full';

      return (
        <div className="flex justify-center mb-5">
          <img
            src={getImageUrl(imageUrl)}
            alt={alt}
            className={`${sizeClass} rounded-2xl object-cover border-2 ${borderClass}`}
            style={{ imageRendering: 'auto' }}
          />
        </div>
      );
    }

    // No image placeholder
    const placeholderSize = entityType === 'character'
      ? 'w-48 h-48'
      : 'w-36 h-36';

    return (
      <div className={`flex justify-center mb-5`}>
        <div className={`${placeholderSize} rounded-2xl bg-ink-800/60 border ${borderClass} flex flex-col items-center justify-center gap-2`}>
          {fallbackIcon}
          <RetryImageButton entityType={entityType} entityId={entityId} showLabel />
        </div>
      </div>
    );
  };

  const renderCharacter = (char: Character) => {
    return (
      <div className="space-y-4">
        {/* Hero image */}
        {renderHeroImage(
          char.imageUrl,
          char.name,
          'character',
          char._id,
          <UserRound size={40} className="text-ink-200/40" />,
          'border-accent-400/30',
        )}

        {/* Name & role */}
        <div className="text-center">
          <h3 className="font-display text-2xl text-ink-100">{char.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs text-accent-400 uppercase tracking-wide font-medium">
              {char.role === 'protagonist' ? t.characterPanel.protagonist : 'NPC'}
            </span>
            {char.status && char.status !== 'active' && (
              <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${CHARACTER_STATUS_CONFIG[char.status].text} ${CHARACTER_STATUS_CONFIG[char.status].bg}`}>
                {entityStatusLabels[char.status]}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-ink-200/80 text-sm leading-relaxed">{char.description}</p>

        {/* New character fields */}
        {(char.background || char.personality || char.goals || char.appearance) && (
          <div className="space-y-3">
            {char.background && (
              <div>
                <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.background}</h4>
                <p className="text-ink-200/80 text-sm leading-relaxed">{char.background}</p>
              </div>
            )}
            {char.personality && (
              <div>
                <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.personality}</h4>
                <p className="text-ink-200/80 text-sm leading-relaxed">{char.personality}</p>
              </div>
            )}
            {char.goals && (
              <div>
                <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.goals}</h4>
                <p className="text-ink-200/80 text-sm leading-relaxed">{char.goals}</p>
              </div>
            )}
            {char.appearance && (
              <div>
                <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1 font-medium">{t.characterPanel.appearance}</h4>
                <p className="text-ink-200/80 text-sm leading-relaxed">{char.appearance}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {char.dynamicStats.length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">{t.storyReader.statsTab}</h4>
            <DynamicStatList stats={char.dynamicStats} />
          </div>
        )}
      </div>
    );
  };

  const renderItem = (item: Item) => {
    const rc = RARITY_CONFIG[item.rarity];
    return (
      <div className="space-y-4">
        {/* Hero image */}
        {renderHeroImage(
          item.imageUrl,
          item.name,
          'item',
          item._id,
          <Package size={36} className="text-ink-200/40" />,
          rc.border,
        )}

        {/* Name & rarity */}
        <div className="text-center">
          <h3 className="font-display text-2xl text-ink-100">{item.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`text-xs uppercase tracking-wide font-bold ${rc.text}`}>
              {rc.icon} {t.rarity[item.rarity]}
            </span>
            {item.status && item.status !== 'active' && (
              <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${ITEM_STATUS_CONFIG[item.status].text} ${ITEM_STATUS_CONFIG[item.status].bg}`}>
                {entityStatusLabels[item.status]}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-ink-200/80 text-sm leading-relaxed">{item.description}</p>

        {/* Properties */}
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
      <div className="space-y-4">
        {/* Hero image */}
        {renderHeroImage(
          si.imageUrl,
          si.name,
          'special-item',
          si._id,
          <Sparkles size={36} className="text-purple-400/40" />,
          rc.border,
        )}

        {/* Name, category & rarity */}
        <div className="text-center">
          <h3 className="font-display text-2xl text-ink-100">{si.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[10px] text-purple-400/80 bg-purple-400/10 px-2 py-0.5 rounded">{si.category}</span>
            <span className={`text-xs uppercase tracking-wide font-bold ${rc.text}`}>
              {rc.icon} {t.rarity[si.rarity]}
            </span>
            {si.status && si.status !== 'active' && (
              <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${SPECIAL_STATUS_CONFIG[si.status].text} ${SPECIAL_STATUS_CONFIG[si.status].bg}`}>
                {entityStatusLabels[si.status]}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-ink-200/80 text-sm leading-relaxed">{si.description}</p>

        {/* Custom Fields */}
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
      <div className={`relative w-full max-w-md bg-ink-900 border rounded-3xl p-6 max-h-[85vh] overflow-y-auto ${rc ? `${rc.border} ${rc.glow}` : 'border-ink-700'}`}>
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

        <div className="relative pt-2">
          {entity.type === 'character' && renderCharacter(entity.data)}
          {entity.type === 'item' && renderItem(entity.data)}
          {entity.type === 'special' && renderSpecialItem(entity.data)}
          {entity.type === 'organization' && renderOrganization(entity.data)}
        </div>
      </div>
    </div>
  );
}

function renderOrganization(org: Organization) {
  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-500/10',
    disbanded: 'text-red-400 bg-red-500/10',
    hidden: 'text-amber-400 bg-amber-500/10',
  };

  return (
    <>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-accent-600/20 flex items-center justify-center shrink-0">
          <Landmark size={24} className="text-accent-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-ink-100">{org.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-ink-200/60 capitalize">{org.type}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[org.status] || 'text-ink-200/50 bg-ink-800'}`}>
              {org.status}
            </span>
          </div>
        </div>
      </div>

      {org.description && (
        <p className="text-sm text-ink-200/80 mb-4">{org.description}</p>
      )}

      {org.goals && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-ink-200/60 uppercase tracking-wider mb-1">Goals</h4>
          <p className="text-sm text-ink-200/80">{org.goals}</p>
        </div>
      )}

      {org.structure && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-ink-200/60 uppercase tracking-wider mb-1">Structure</h4>
          <p className="text-sm text-ink-200/80">{org.structure}</p>
        </div>
      )}

      {org.dynamicStats.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-ink-200/60 uppercase tracking-wider mb-2">Stats</h4>
          <DynamicStatList stats={org.dynamicStats} />
        </div>
      )}

      {Array.isArray(org.memberIds) && org.memberIds.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-ink-200/60 uppercase tracking-wider mb-2">Members</h4>
          <div className="flex flex-wrap gap-2">
            {org.memberIds.map((member) => {
              const name = typeof member === 'string' ? member : member.name;
              return (
                <span key={name} className="text-xs px-2 py-1 bg-ink-800 rounded-lg text-ink-200/80">
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export type { EntityData };
