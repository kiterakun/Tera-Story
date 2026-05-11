import { Heart, Network, Package, Skull, Sparkles, UserRound, Users, AlertTriangle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from './EntityDetailModal';
import type { Character, Item, ItemRarity, Relationship, SpecialItem } from '../services/playthroughApi';
import { useTranslation } from '../i18n';
import { getImageUrl } from '../utils/url';
import type { ResourceTemplate } from './CharacterPanel';

const rarityColor: Record<ItemRarity, string> = {
  common: 'text-ink-200/70',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

type RpgTab = 'stats' | 'inventory' | 'abilities' | 'relations';

interface RPGPanelProps {
  rpgTab: RpgTab;
  setRpgTab: Dispatch<SetStateAction<RpgTab>>;
  tabLabels: Record<RpgTab, string>;
  protagonist: Character | null;
  sortedNpcs: Character[];
  sortedItems: Item[];
  sortedSpecialItems: SpecialItem[];
  characters: Character[];
  relationships: Relationship[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  setIsRelationshipModalOpen: Dispatch<SetStateAction<boolean>>;
  isRelationshipModalOpen: boolean;
  t: ReturnType<typeof useTranslation>;
  resourceTemplates?: ResourceTemplate[];
}

export default function RPGPanel({
  rpgTab,
  setRpgTab,
  tabLabels,
  protagonist,
  sortedNpcs,
  sortedItems,
  sortedSpecialItems,
  characters,
  relationships,
  setDetailEntity,
  setIsRelationshipModalOpen,
  isRelationshipModalOpen,
  t,
  resourceTemplates,
}: RPGPanelProps) {
  void isRelationshipModalOpen;

  const npcs = characters.filter(c => c.role === 'npc');
  const getTemplate = (key: string) => resourceTemplates?.find(t => t.key === key);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tabs */}
      <div className="flex border-b border-ink-700 mb-4 shrink-0">
        {(['stats', 'inventory', 'abilities'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setRpgTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              rpgTab === tab
                ? 'text-accent-400 border-b-2 border-accent-400'
                : 'text-ink-200/50 hover:text-ink-200/80'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {rpgTab === 'stats' && (
        <div className="space-y-5 overflow-y-auto flex-1">
          {protagonist && (
            <div>
              <button onClick={() => setDetailEntity({ type: 'character', data: protagonist })} className="flex items-center gap-3 mb-3 w-full text-left hover:bg-ink-800/50 rounded-xl p-1.5 -m-1.5 transition-colors cursor-pointer">
                {protagonist.imageUrl ? (
                  <img src={getImageUrl(protagonist.imageUrl)} alt={protagonist.name} className="w-12 h-12 rounded-xl object-cover border-2 border-accent-400/30" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-ink-700/50 border border-ink-600 flex items-center justify-center"><UserRound size={20} className="text-ink-200/60" /></div>
                )}
                <div>
                  <h4 className="font-display text-sm text-ink-100">{protagonist.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-accent-400 uppercase tracking-wide font-medium">{t.characterPanel.protagonist}</span>
                    {protagonist.status && protagonist.status !== 'active' && (
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${
                        protagonist.status === 'dead' ? 'bg-red-500/10 text-red-400' :
                        protagonist.status === 'injured' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>{t.entityStatus[protagonist.status]}</span>
                    )}
                  </div>
                </div>
              </button>
              <div className="space-y-1.5">
                {protagonist.dynamicStats.map(stat => {
                  const template = getTemplate(stat.k);
                  const isEnumInvalid = stat.t === 'enum' && template?.options && !template.options.includes(String(stat.v));
                  return (
                    <div key={stat.k}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-ink-200/70">{stat.k}</span>
                        <span className={`font-mono flex items-center gap-1 ${isEnumInvalid ? 'text-red-400 border border-red-500/40 rounded px-1 -mx-1' : 'text-ink-100'}`}>
                          {String(stat.v)}
                          {isEnumInvalid && <AlertTriangle size={12} className="text-red-400 shrink-0" title={`Valid: ${template?.options?.join(', ')}`} />}
                        </span>
                      </div>
                      {stat.t === 'progress' && (
                        <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Number(stat.v))}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {npcs.length > 0 && (
            <div>
              <h4 className="font-display text-xs text-ink-200/60 uppercase tracking-wider mb-2">{t.characterPanel.storyCharacters}</h4>
              <div className="space-y-1">
                {sortedNpcs.map(npc => {
                  const isInactive = npc.status && npc.status !== 'active';
                  return (
                    <button key={npc._id} onClick={() => setDetailEntity({ type: 'character', data: npc })} className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-ink-800/50 transition-colors w-full text-left cursor-pointer ${isInactive ? 'opacity-50' : ''}`}>
                      {npc.imageUrl ? (
                        <img src={getImageUrl(npc.imageUrl)} alt={npc.name} className={`w-9 h-9 rounded-lg object-cover border border-ink-600 ${npc.status === 'dead' ? 'grayscale' : ''}`} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-ink-700/50 border border-ink-600 flex items-center justify-center">
                          {npc.status === 'dead' ? <Skull size={14} className="text-red-400/60" /> : <Users size={14} className="text-ink-200/60" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm truncate ${npc.status === 'dead' ? 'text-ink-200/50 line-through' : 'text-ink-100'}`}>{npc.name}</p>
                          {isInactive && (
                            <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
                              npc.status === 'dead' ? 'bg-red-500/10 text-red-400' :
                              npc.status === 'injured' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>{t.entityStatus[npc.status]}</span>
                          )}
                        </div>
                        <p className="text-ink-200/50 text-xs truncate">{npc.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!protagonist && npcs.length === 0 && (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noCharacters}</p>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {rpgTab === 'inventory' && (
        <div className="space-y-2 overflow-y-auto flex-1">
          {sortedItems.length > 0 ? sortedItems.map(item => {
            const isInactive = item.status && item.status !== 'active';
            return (
              <button key={item._id} onClick={() => setDetailEntity({ type: 'item', data: item })} className={`bg-ink-800/60 border border-ink-700 rounded-xl p-3 w-full text-left hover:bg-ink-800 hover:border-ink-600 transition-colors cursor-pointer ${isInactive ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-2.5">
                  {item.imageUrl ? (
                    <img src={getImageUrl(item.imageUrl)} alt={item.name} className={`w-9 h-9 rounded-lg object-cover border border-ink-600 shrink-0 ${isInactive ? 'grayscale' : ''}`} />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-ink-700/50 border border-ink-600 flex items-center justify-center shrink-0"><Package size={14} className="text-ink-200/60" /></div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${isInactive ? 'text-ink-200/50 line-through' : 'text-ink-100'}`}>{item.name}</p>
                      {isInactive && (
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
                          item.status === 'destroyed' ? 'bg-red-500/10 text-red-400' :
                          item.status === 'consumed' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>{t.entityStatus[item.status]}</span>
                      )}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide font-medium ${rarityColor[item.rarity]}`}>{t.rarity[item.rarity]}</span>
                  </div>
                </div>
                <p className="text-ink-200/60 text-xs mt-1.5 line-clamp-2">{item.description}</p>
              </button>
            );
          }) : (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noItems}</p>
          )}
        </div>
      )}

      {/* Abilities Tab */}
      {rpgTab === 'abilities' && (
        <div className="space-y-2 overflow-y-auto flex-1">
          {sortedSpecialItems.length > 0 ? sortedSpecialItems.map(si => {
            const isInactive = si.status && si.status !== 'active';
            return (
              <button key={si._id} onClick={() => setDetailEntity({ type: 'special', data: si })} className={`bg-ink-800/60 border border-ink-700 rounded-xl p-3 w-full text-left hover:bg-ink-800 hover:border-ink-600 transition-colors cursor-pointer ${isInactive ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-2.5">
                  {si.imageUrl ? (
                    <img src={getImageUrl(si.imageUrl)} alt={si.name} className={`w-9 h-9 rounded-lg object-cover border border-ink-600 shrink-0 ${isInactive ? 'grayscale' : ''}`} />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-purple-900/30 border border-purple-400/20 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-purple-400/60" /></div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${isInactive ? 'text-ink-200/50 line-through' : 'text-ink-100'}`}>{si.name}</p>
                      {isInactive && (
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
                          si.status === 'sealed' ? 'bg-red-500/10 text-red-400' :
                          si.status === 'consumed' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>{t.entityStatus[si.status]}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-purple-400/80 bg-purple-400/10 px-1.5 py-0.5 rounded">{si.category}</span>
                      <span className={`text-[10px] uppercase tracking-wide font-medium ${rarityColor[si.rarity]}`}>{t.rarity[si.rarity]}</span>
                    </div>
                  </div>
                </div>
                <p className="text-ink-200/60 text-xs mt-1.5 line-clamp-2">{si.description}</p>
              </button>
            );
          }) : (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noSpecialItems}</p>
          )}
        </div>
      )}

      {/* Relationships Tab */}
      {rpgTab === 'relations' && (
        <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex justify-between items-center px-1 mb-1">
            <span className="text-xs text-ink-400 uppercase tracking-wider font-semibold">Connections</span>
            {relationships.length > 0 && (
              <button 
                onClick={() => setIsRelationshipModalOpen(true)}
                className="flex items-center gap-1.5 text-[10px] bg-accent-500/10 text-accent-300 hover:text-accent-200 hover:bg-accent-500/20 px-2 py-1 rounded border border-accent-500/20 transition-colors"
              >
                <Network size={12} />
                View Web
              </button>
            )}
          </div>
          {relationships.length > 0 ? relationships.map(rel => {
            const typeColors: Record<string, string> = {
              ally: 'text-emerald-400 bg-emerald-400/10',
              enemy: 'text-red-400 bg-red-400/10',
              romantic: 'text-pink-400 bg-pink-400/10',
              mentor: 'text-blue-400 bg-blue-400/10',
              rival: 'text-amber-400 bg-amber-400/10',
              neutral: 'text-ink-300 bg-ink-700/50',
              family: 'text-purple-400 bg-purple-400/10',
            };
            const color = typeColors[rel.type] || typeColors.neutral;
            return (
              <div key={rel._id} className="bg-ink-800/60 border border-ink-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={12} className="text-pink-400/60" />
                  <span className="text-sm text-ink-100 font-medium">{rel.characterA.name}</span>
                  <span className="text-ink-400 text-xs">↔</span>
                  <span className="text-sm text-ink-100 font-medium">{rel.characterB.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>
                    {(t.relationship as Record<string, string>)[rel.type] || rel.type}
                  </span>
                  <div className="flex-1 h-1 bg-ink-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-400/60 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, rel.intensity * 10))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-ink-400 tabular-nums">{rel.intensity}/10</span>
                </div>
              </div>
            );
          }) : (
            <p className="text-ink-200/40 text-sm italic">{t.storyReader.noRelationships}</p>
          )}
        </div>
      )}
    </div>
  );
}
