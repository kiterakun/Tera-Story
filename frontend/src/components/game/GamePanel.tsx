import { useState, useEffect } from 'react';
import {
  X,
  UserRound,
  Users,
  Network,
  MapPin,
  Package,
  Sparkles,
  Archive,
  RotateCcw,
  Skull,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../EntityDetailModal';
import type { Character, Item, SpecialItem, Relationship } from '../../services/playthroughApi';
import { useTranslation } from '../../i18n';
import { useArchive } from '../../hooks/useArchive';
import { useMap } from '../../hooks/useMap';
import { getImageUrl } from '../../utils/url';

type GameTab = 'character' | 'companions' | 'relationships' | 'map' | 'inventory' | 'abilities' | 'archive';

interface GamePanelProps {
  isOpen: boolean;
  onClose: () => void;
  playthroughId: string;
  protagonist: Character | null;
  sortedNpcs: Character[];
  sortedItems: Item[];
  sortedSpecialItems: SpecialItem[];
  characters: Character[];
  relationships: Relationship[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  setIsRelationshipModalOpen: Dispatch<SetStateAction<boolean>>;
  t: ReturnType<typeof useTranslation>;
}

const TABS: { id: GameTab; icon: typeof UserRound; labelKey: string }[] = [
  { id: 'character', icon: UserRound, labelKey: 'protagonist' },
  { id: 'companions', icon: Users, labelKey: 'companions' },
  { id: 'relationships', icon: Network, labelKey: 'relationships' },
  { id: 'map', icon: MapPin, labelKey: 'map' },
  { id: 'inventory', icon: Package, labelKey: 'inventory' },
  { id: 'abilities', icon: Sparkles, labelKey: 'specialItems' },
  { id: 'archive', icon: Archive, labelKey: 'archive' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-500/10',
  dead: 'text-red-400 bg-red-500/10',
  injured: 'text-amber-400 bg-amber-500/10',
  missing: 'text-gray-400 bg-gray-500/10',
};

const STATUS_ICONS: Record<string, typeof Skull> = {
  active: UserRound,
  dead: Skull,
  injured: AlertTriangle,
  missing: HelpCircle,
};

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-300 border-gray-500/30',
  uncommon: 'text-green-400 border-green-500/30',
  rare: 'text-blue-400 border-blue-500/30',
  epic: 'text-purple-400 border-purple-500/30',
  legendary: 'text-amber-400 border-amber-500/30',
};

export default function GamePanel({
  isOpen,
  onClose,
  playthroughId,
  protagonist,
  sortedNpcs,
  sortedItems,
  sortedSpecialItems,
  characters,
  relationships,
  setDetailEntity,
  setIsRelationshipModalOpen,
  t,
}: GamePanelProps) {
  const [activeTab, setActiveTab] = useState<GameTab>('character');
  const [expandedNpcId, setExpandedNpcId] = useState<string | null>(null);

  const { archived, isLoading: archiveLoading, fetchArchived, restoreEntity } = useArchive(playthroughId);
  const { currentContext, playthroughLocations, fetchCurrentLocation, fetchAllLocations } = useMap();

  useEffect(() => {
    if (isOpen && activeTab === 'archive') {
      fetchArchived();
    }
    if (isOpen && activeTab === 'map') {
      fetchCurrentLocation(playthroughId);
      fetchAllLocations(playthroughId);
    }
  }, [isOpen, activeTab, playthroughId, fetchArchived, fetchCurrentLocation, fetchAllLocations]);

  if (!isOpen) return null;

  const getTabLabel = (tab: typeof TABS[number]) => {
    const key = tab.labelKey as keyof typeof t.characterPanel;
    return t.characterPanel[key] || tab.labelKey;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-ink-900 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700 shrink-0">
          <h2 className="font-display text-lg text-ink-100">{t.playthrough.gameMenu}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Tab sidebar */}
          <div className="w-48 border-r border-ink-700 bg-ink-900/50 p-2 shrink-0 overflow-y-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent-600/10 text-accent-400 border border-accent-600/20'
                      : 'text-ink-200/70 hover:text-ink-100 hover:bg-ink-800/50'
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{getTabLabel(tab)}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Character Tab */}
            {activeTab === 'character' && protagonist && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl bg-ink-950 border border-ink-700 overflow-hidden shrink-0">
                    {protagonist.imageUrl ? (
                      <img src={getImageUrl(protagonist.imageUrl)} alt={protagonist.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-display text-ink-500 font-bold">
                        {protagonist.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-ink-100">{protagonist.name}</h3>
                    <p className="text-sm text-accent-400">{t.characterPanel.protagonist}</p>
                    {protagonist.description && (
                      <p className="text-sm text-ink-200/70 mt-2">{protagonist.description}</p>
                    )}
                  </div>
                </div>

                {/* Character details */}
                {(protagonist.background || protagonist.personality || protagonist.goals || protagonist.appearance) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {protagonist.background && (
                      <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
                        <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1">{t.characterPanel.background}</h4>
                        <p className="text-sm text-ink-200/80">{protagonist.background}</p>
                      </div>
                    )}
                    {protagonist.personality && (
                      <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
                        <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1">{t.characterPanel.personality}</h4>
                        <p className="text-sm text-ink-200/80">{protagonist.personality}</p>
                      </div>
                    )}
                    {protagonist.goals && (
                      <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
                        <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1">{t.characterPanel.goals}</h4>
                        <p className="text-sm text-ink-200/80">{protagonist.goals}</p>
                      </div>
                    )}
                    {protagonist.appearance && (
                      <div className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
                        <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-1">{t.characterPanel.appearance}</h4>
                        <p className="text-sm text-ink-200/80">{protagonist.appearance}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                {protagonist.dynamicStats.length > 0 && (
                  <div>
                    <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-3 font-medium">Stats</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {protagonist.dynamicStats.map(stat => (
                        <div key={stat.k} className="bg-ink-950/50 rounded-xl p-3 border border-ink-700/50">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-ink-200/70">{stat.k}</span>
                            <span className="font-mono text-ink-100">
                              {stat.t === 'pool' && stat.maxV !== undefined
                                ? `${stat.v} / ${stat.maxV}`
                                : String(stat.v)}
                            </span>
                          </div>
                          {(stat.t === 'progress' || stat.t === 'pool') && (
                            <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${stat.t === 'pool' ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-accent-600'}`}
                                style={{
                                  width: `${stat.t === 'pool' && stat.maxV
                                    ? Math.min(100, (Number(stat.v) / stat.maxV) * 100)
                                    : Math.min(100, Number(stat.v))}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Companions Tab */}
            {activeTab === 'companions' && (
              <div className="space-y-3">
                {sortedNpcs.length === 0 ? (
                  <p className="text-sm text-ink-200/50 text-center py-8">{t.characterPanel.noCompanions}</p>
                ) : (
                  sortedNpcs.map(npc => {
                    const statusColor = STATUS_COLORS[npc.status] || STATUS_COLORS.active;
                    const StatusIcon = STATUS_ICONS[npc.status] || UserRound;
                    const isExpanded = expandedNpcId === npc._id;

                    return (
                      <div
                        key={npc._id}
                        className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 cursor-pointer hover:border-ink-600 transition-colors"
                        onClick={() => setExpandedNpcId(isExpanded ? null : npc._id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-ink-900 border border-ink-700 overflow-hidden shrink-0">
                            {npc.imageUrl ? (
                              <img src={getImageUrl(npc.imageUrl)} alt={npc.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-display text-ink-500 font-bold">
                                {npc.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm text-ink-100 truncate">{npc.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor}`}>
                                <StatusIcon size={10} className="inline mr-0.5" />
                                {npc.status}
                              </span>
                            </div>
                            {npc.description && (
                              <p className="text-xs text-ink-200/50 truncate mt-0.5">{npc.description}</p>
                            )}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-ink-700/50 space-y-2">
                            {npc.description && <p className="text-sm text-ink-200/70">{npc.description}</p>}
                            {npc.dynamicStats.length > 0 && (
                              <div className="grid grid-cols-2 gap-1.5">
                                {npc.dynamicStats.map(stat => (
                                  <div key={stat.k} className="flex justify-between text-xs bg-ink-900/50 rounded px-2 py-1">
                                    <span className="text-ink-200/50">{stat.k}</span>
                                    <span className="font-mono text-ink-100">
                                      {stat.t === 'pool' && stat.maxV !== undefined
                                        ? `${stat.v}/${stat.maxV}`
                                        : String(stat.v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); setDetailEntity({ type: 'character', data: npc }); }}
                              className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Relationships Tab */}
            {activeTab === 'relationships' && (
              <div className="space-y-3">
                {relationships.length === 0 ? (
                  <p className="text-sm text-ink-200/50 text-center py-8">No relationships yet.</p>
                ) : (
                  <>
                    <button
                      onClick={() => setIsRelationshipModalOpen(true)}
                      className="w-full bg-ink-950/50 border border-ink-700/50 rounded-xl p-3 text-sm text-accent-400 hover:text-accent-300 hover:border-accent-600/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Network size={16} />
                      View Relationship Web
                    </button>
                    {relationships.map(rel => {
                      const charA = characters.find(c => c._id === rel.characterA._id) || rel.characterA;
                      const charB = characters.find(c => c._id === rel.characterB._id) || rel.characterB;
                      if (!charA || !charB) return null;

                      const intensityColor = rel.intensity > 50 ? 'text-green-400' : rel.intensity < -50 ? 'text-red-400' : 'text-ink-200/70';

                      return (
                        <div key={`${rel.characterA._id}-${rel.characterB._id}`} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-ink-100">{charA.name}</span>
                              <span className="text-ink-200/40">&</span>
                              <span className="text-ink-100">{charB.name}</span>
                            </div>
                            <span className={`text-xs font-mono ${intensityColor}`}>{rel.intensity}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-ink-200/50 capitalize">{rel.type}</span>
                            <div className="flex-1 h-1 bg-ink-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${rel.intensity > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.abs(rel.intensity)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <div className="space-y-4">
                {currentContext?.location ? (
                  <div className="bg-accent-900/20 border border-accent-500/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-accent-400" />
                      <h4 className="font-display text-accent-300">Current Location</h4>
                    </div>
                    <h3 className="font-display text-lg text-ink-100">{currentContext.location.name}</h3>
                    <p className="text-sm text-ink-200/70 mt-1">{currentContext.location.description}</p>
                    {currentContext.location.dynamicStats && currentContext.location.dynamicStats.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 mt-3">
                        {currentContext.location.dynamicStats.map(stat => (
                          <div key={stat.k} className="flex justify-between text-xs bg-ink-900/50 rounded px-2 py-1">
                            <span className="text-ink-200/50">{stat.k}</span>
                            <span className="font-mono text-ink-100">
                              {stat.t === 'pool' && stat.maxV !== undefined
                                ? `${stat.v}/${stat.maxV}`
                                : String(stat.v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ink-200/50 text-center py-4">No current location set.</p>
                )}

                {playthroughLocations.length > 0 && (
                  <div>
                    <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Discovered Locations</h4>
                    <div className="space-y-2">
                      {playthroughLocations.map(loc => (
                        <div key={loc._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-ink-400" />
                            <span className="text-sm text-ink-100">{loc.name}</span>
                            <span className="text-xs text-ink-200/40 capitalize">{loc.type}</span>
                          </div>
                          {loc.dynamicStats && loc.dynamicStats.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {loc.dynamicStats.map(stat => (
                                <div key={stat.k} className="flex justify-between text-[11px] bg-ink-900/50 rounded px-1.5 py-0.5">
                                  <span className="text-ink-200/40">{stat.k}</span>
                                  <span className="font-mono text-ink-200/70">
                                    {stat.t === 'pool' && stat.maxV !== undefined
                                      ? `${stat.v}/${stat.maxV}`
                                      : String(stat.v)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-3">
                {sortedItems.length === 0 ? (
                  <p className="text-sm text-ink-200/50 text-center py-8">{t.characterPanel.noItems}</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sortedItems.map(item => {
                      const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                      return (
                        <div
                          key={item._id}
                          onClick={() => setDetailEntity({ type: 'item', data: item })}
                          className={`bg-ink-950/50 rounded-xl border p-3 cursor-pointer hover:border-ink-600 transition-colors ${rarityColor}`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-ink-900 border border-ink-700 overflow-hidden mb-2 mx-auto">
                            {item.imageUrl ? (
                              <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={20} className="text-ink-500" />
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-display text-ink-100 text-center truncate">{item.name}</h4>
                          <p className="text-[10px] text-center capitalize mt-0.5">{item.rarity}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Abilities Tab */}
            {activeTab === 'abilities' && (
              <div className="space-y-3">
                {sortedSpecialItems.length === 0 ? (
                  <p className="text-sm text-ink-200/50 text-center py-8">{t.characterPanel.noSpecialItems}</p>
                ) : (
                  (() => {
                    const grouped: Record<string, SpecialItem[]> = {};
                    sortedSpecialItems.forEach(si => {
                      const cat = si.category || 'Other';
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat]!.push(si);
                    });
                    return Object.entries(grouped).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">{category}</h4>
                        <div className="space-y-2">
                          {items.map(si => {
                            const rarityColor = RARITY_COLORS[si.rarity] || RARITY_COLORS.common;
                            return (
                              <div
                                key={si._id}
                                onClick={() => setDetailEntity({ type: 'special', data: si })}
                                className={`bg-ink-950/50 rounded-xl border p-3 cursor-pointer hover:border-ink-600 transition-colors ${rarityColor}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Sparkles size={14} />
                                  <span className="text-sm font-display text-ink-100">{si.name}</span>
                                  <span className="text-[10px] capitalize text-ink-200/40 ml-auto">{si.rarity}</span>
                                </div>
                                {si.description && (
                                  <p className="text-xs text-ink-200/50 mt-1 line-clamp-2">{si.description}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            )}

            {/* Archive Tab */}
            {activeTab === 'archive' && (
              <div className="space-y-4">
                {archiveLoading ? (
                  <p className="text-sm text-ink-200/50 text-center py-8">Loading...</p>
                ) : !archived || (
                  archived.characters.length === 0 &&
                  archived.items.length === 0 &&
                  archived.specialItems.length === 0 &&
                  archived.locations.length === 0
                ) ? (
                  <p className="text-sm text-ink-200/50 text-center py-8">{t.playthrough.noArchived}</p>
                ) : (
                  <>
                    {archived.characters.length > 0 && (
                      <div>
                        <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Characters</h4>
                        <div className="space-y-2">
                          {archived.characters.map(char => (
                            <div key={char._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 flex items-center justify-between">
                              <div>
                                <span className="text-sm text-ink-100">{char.name}</span>
                                <span className="text-xs text-ink-200/40 ml-2">{char.status}</span>
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
                    {archived.specialItems.length > 0 && (
                      <div>
                        <h4 className="text-xs text-ink-200/50 uppercase tracking-wider mb-2">Special Items</h4>
                        <div className="space-y-2">
                          {archived.specialItems.map(si => (
                            <div key={si._id} className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3 flex items-center justify-between">
                              <div>
                                <span className="text-sm text-ink-100">{si.name}</span>
                                <span className="text-xs text-ink-200/40 ml-2">{si.category}</span>
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
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
