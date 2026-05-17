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
  Landmark,
  Compass,
  Globe,
  Mountain,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWorldMap } from '../../services/mapApi';
import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../EntityDetailModal';
import type { Character, Item, SpecialItem, Relationship } from '../../services/playthroughApi';
import { useTranslation } from '../../i18n';
import { useArchive } from '../../hooks/useArchive';
import { useMap } from '../../hooks/useMap';
import { useStoryStore } from '../../stores/storyStore';
import { getImageUrl } from '../../utils/url';
import { DynamicStatList } from '../DynamicStatDisplay';
import { CharacterTab } from './CharacterTab';
import { CompanionsTab } from './CompanionsTab';
import { ArchiveTab } from './ArchiveTab';

type GameTab = 'character' | 'companions' | 'relationships' | 'map' | 'inventory' | 'abilities' | 'organizations' | 'archive';

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
  { id: 'organizations', icon: Landmark, labelKey: 'organizations' },
  { id: 'archive', icon: Archive, labelKey: 'archive' },
];



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
  const world = useStoryStore((state) => state.world);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<GameTab>('character');
  const [continentMap, setContinentMap] = useState<Map<string, string>>(new Map());

  const { archived, isLoading: archiveLoading, fetchArchived, restoreEntity } = useArchive(playthroughId);
  const { currentContext, playthroughLocations, fetchCurrentLocation, fetchAllLocations } = useMap();

  // Load world map to get continent names
  useEffect(() => {
    if (isOpen && world?._id) {
      getWorldMap(world._id)
        .then((data) => {
          if (data && data.continents) {
            const m = new Map<string, string>();
            data.continents.forEach(c => {
              m.set(c._id, c.name);
            });
            setContinentMap(m);
          }
        })
        .catch((err) => console.error('Failed to load map data in GamePanel:', err));
    }
  }, [isOpen, world?._id]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-ink-900 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-auto max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-ink-700 shrink-0">
          <h2 className="font-display text-base sm:text-lg text-ink-100">{t.playthrough.gameMenu}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Tab sidebar */}
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-ink-700 bg-ink-900/50 p-2 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-1.5 md:gap-0 scrollbar-none">
            {TABS.map(tab => {
               const Icon = tab.icon;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors shrink-0 md:w-full ${
                     activeTab === tab.id
                       ? 'bg-accent-600/10 text-accent-400 border border-accent-600/20'
                       : 'text-ink-200/70 hover:text-ink-100 hover:bg-ink-800/50'
                   }`}
                 >
                   <Icon size={16} className="shrink-0" />
                   <span className="truncate">{getTabLabel(tab)}</span>
                 </button>
               );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Character Tab */}
            {activeTab === 'character' && (
              <CharacterTab protagonist={protagonist} setDetailEntity={setDetailEntity} t={t} />
            )}

            {/* Companions Tab */}
            {activeTab === 'companions' && (
              <CompanionsTab sortedNpcs={sortedNpcs} setDetailEntity={setDetailEntity} t={t} />
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
              <div className="space-y-4 animate-fade-in">
                {/* View Detailed Map Button */}
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/playthroughs/${playthroughId}/map`);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-accent-600/20 cursor-pointer"
                >
                  <Compass size={16} />
                  {t.map.viewDetailedMap}
                </button>

                {currentContext?.location ? (
                  <div className="bg-accent-900/20 border border-accent-500/40 rounded-xl p-4">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-accent-400" />
                        <h4 className="font-display text-accent-300">Current Location</h4>
                      </div>
                      {currentContext.region && (
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-accent-300">
                          <span className="flex items-center gap-1">
                            <Mountain size={10} className="text-accent-400" />
                            {currentContext.region.name}
                          </span>
                          <span className="text-accent-500/30">|</span>
                          <span className="flex items-center gap-1">
                            <Globe size={10} className="text-accent-400" />
                            {currentContext.continent?.name || t.map.continent}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-lg text-ink-100">{currentContext.location.name}</h3>
                    <p className="text-sm text-ink-200/70 mt-1">{currentContext.location.description}</p>
                    {currentContext.location.dynamicStats && currentContext.location.dynamicStats.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 mt-3">
                        {currentContext.location.dynamicStats.map((stat, idx) => (
                          <div key={idx} className="bg-ink-900/50 rounded px-2 py-1">
                            <DynamicStatList stats={[stat]} templates={world?.locationResourceTemplates} compact />
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
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-ink-400" />
                              <span className="text-sm text-ink-100 font-medium">{loc.name}</span>
                              <span className="text-xs text-ink-200/40 capitalize">({t.map.types[loc.type as keyof typeof t.map.types] || loc.type})</span>
                            </div>
                            {loc.region && (
                              <div className="flex items-center gap-1.5 text-[9px] text-ink-200/40">
                                <span className="flex items-center gap-0.5">
                                  <Mountain size={9} />
                                  {loc.region.name}
                                </span>
                                <span>/</span>
                                <span className="flex items-center gap-0.5">
                                  <Globe size={9} />
                                  {continentMap.get(loc.region.continentId) || t.map.continent}
                                </span>
                              </div>
                            )}
                          </div>
                          {loc.dynamicStats && loc.dynamicStats.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {loc.dynamicStats.map((stat, idx) => (
                                <div key={idx} className="bg-ink-900/50 rounded px-1.5 py-0.5">
                                  <DynamicStatList stats={[stat]} templates={world?.locationResourceTemplates} compact />
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

            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
              <OrganizationsTab
                setDetailEntity={setDetailEntity}
                t={t}
              />
            )}

            {/* Archive Tab */}
            {activeTab === 'archive' && (
              <ArchiveTab archived={archived} isLoading={archiveLoading} restoreEntity={restoreEntity} t={t} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Organizations Tab Component ──

interface OrganizationsTabProps {
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  t: ReturnType<typeof useTranslation>;
}

function OrganizationsTab({ setDetailEntity, t }: OrganizationsTabProps) {
  const { organizations } = useStoryStore();

  if (organizations.length === 0) {
    return (
      <p className="text-sm text-ink-200/50 text-center py-8">
        {t.playthrough.noOrganizations ?? 'No organizations discovered yet.'}
      </p>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-500/10',
    disbanded: 'text-red-400 bg-red-500/10',
    hidden: 'text-amber-400 bg-amber-500/10',
  };

  return (
    <div className="space-y-3">
      {organizations.map((org) => (
        <div
          key={org._id}
          onClick={() => setDetailEntity({ type: 'organization', data: org })}
          className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-4 cursor-pointer hover:border-accent-400/30 transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-ink-100 truncate">{org.name}</h4>
              <p className="text-xs text-ink-200/50 mt-0.5 capitalize">{org.type}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[org.status] || 'text-ink-200/50 bg-ink-800'}`}>
              {org.status}
            </span>
          </div>
          {org.description && (
            <p className="text-xs text-ink-200/60 mt-2 line-clamp-2">{org.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-ink-200/40">
            <span>{Array.isArray(org.memberIds) ? org.memberIds.length : 0} members</span>
            {org.dynamicStats.length > 0 && <span>{org.dynamicStats.length} stats</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
