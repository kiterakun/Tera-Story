import { RotateCcw } from 'lucide-react';
import type { Character, Item, SpecialItem } from '../../services/playthroughApi';
import type { Organization } from '../../types/entities';
import { useTranslation } from '../../i18n';
import type { Location } from '../../services/mapApi';

interface ArchivedEntities {
  characters: Character[];
  items: Item[];
  specialItems: SpecialItem[];
  locations: Location[];
  organizations: Organization[];
}

interface ArchiveTabProps {
  archived: ArchivedEntities | null;
  isLoading: boolean;
  restoreEntity: (entityType: 'character' | 'item' | 'special-item' | 'location' | 'organization', entityId: string) => void;
  t: ReturnType<typeof useTranslation>;
}

export function ArchiveTab({ archived, isLoading, restoreEntity, t }: ArchiveTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">Loading...</p>
      </div>
    );
  }

  if (!archived || (
    archived.characters.length === 0 &&
    archived.items.length === 0 &&
    archived.specialItems.length === 0 &&
    archived.locations.length === 0 &&
    archived.organizations.length === 0
  )) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">{t.playthrough.noArchived}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {/* Characters */}
        {archived.characters.length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Characters</h4>
            <div className="space-y-2">
              {archived.characters.map(char => (
                <div key={char._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-ink-100">{char.name}</span>
                    <span className="text-xs text-ink-200/40 ml-2">{char.role}</span>
                    {char.status !== 'active' && (
                      <span className="text-xs text-ink-200/40 ml-1">({char.status})</span>
                    )}
                  </div>
                  <button
                    onClick={() => restoreEntity('character', char._id)}
                    className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    {t.playthrough.restore}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        {archived.items.length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Items</h4>
            <div className="space-y-2">
              {archived.items.map(item => (
                <div key={item._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-ink-100">{item.name}</span>
                    <span className="text-xs text-ink-200/40 ml-2">{item.rarity}</span>
                  </div>
                  <button
                    onClick={() => restoreEntity('item', item._id)}
                    className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    {t.playthrough.restore}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Items */}
        {archived.specialItems.length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Special Items</h4>
            <div className="space-y-2">
              {archived.specialItems.map(si => (
                <div key={si._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-ink-100">{si.name}</span>
                    <span className="text-xs text-ink-200/40 ml-2">{si.category}</span>
                    <span className="text-xs text-ink-200/40 ml-1">({si.rarity})</span>
                  </div>
                  <button
                    onClick={() => restoreEntity('special-item', si._id)}
                    className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    {t.playthrough.restore}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations */}
        {archived.locations.length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Locations</h4>
            <div className="space-y-2">
              {archived.locations.map(loc => (
                <div key={loc._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-ink-100">{loc.name}</span>
                    <span className="text-xs text-ink-200/40 ml-2">{loc.type}</span>
                  </div>
                  <button
                    onClick={() => restoreEntity('location', loc._id)}
                    className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    {t.playthrough.restore}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organizations */}
        {archived.organizations.length > 0 && (
          <div>
            <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Organizations</h4>
            <div className="space-y-2">
              {archived.organizations.map(org => (
                <div key={org._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-ink-100">{org.name}</span>
                    <span className="text-xs text-ink-200/40 ml-2">{org.type}</span>
                  </div>
                  <button
                    onClick={() => restoreEntity('organization', org._id)}
                    className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    {t.playthrough.restore}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
