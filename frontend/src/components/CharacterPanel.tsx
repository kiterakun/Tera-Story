import React, { useState } from 'react';

export interface DynamicStat {
  k: string;  // key name
  v: any;     // value
  t: string;  // type: 'number' | 'text' | 'progress' | 'enum'
}

export interface ResourceTemplate {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum';
  min?: number;
  max?: number;
  displayFormat?: string;  // e.g. "{v} MP"
}

export interface Character {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  role: 'protagonist' | 'npc';
  dynamicStats: DynamicStat[];
}

export interface CharacterPanelProps {
  protagonist: Character | null;
  npcs: Character[];
  resourceTemplates: ResourceTemplate[];  // from world, for displayFormat
}

export function CharacterPanel({ protagonist, npcs, resourceTemplates }: CharacterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatStat = (stat: DynamicStat, template?: ResourceTemplate) => {
    const displayFormat = template?.displayFormat;
    if (displayFormat) return displayFormat.replace('{v}', String(stat.v));
    if (stat.t === 'progress' && template?.max) return `${stat.v} / ${template.max}`;
    return String(stat.v);
  };

  const getTemplate = (key: string) => resourceTemplates.find(t => t.key === key);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-ink-800 border border-ink-700 rounded-l-lg p-3 hover:border-accent-400 transition-colors"
        title="Character Panel"
      >
        <span className="text-parchment-50">⚔️</span>
      </button>

      {/* Panel drawer */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-ink-900 border-l border-ink-700 z-20 transform transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg text-parchment-50">Characters</h2>
            <button onClick={() => setIsOpen(false)} className="text-ink-200 hover:text-parchment-50">✕</button>
          </div>

          {/* Protagonist */}
          {protagonist && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                {protagonist.imageUrl ? (
                  <img src={protagonist.imageUrl} alt={protagonist.name} className="w-16 h-16 rounded-full object-cover border-2 border-accent-400" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-ink-700 border-2 border-ink-600 flex items-center justify-center text-2xl">👤</div>
                )}
                <div>
                  <h3 className="font-display text-parchment-50">{protagonist.name}</h3>
                  <span className="text-xs text-accent-400 uppercase tracking-wide">Protagonist</span>
                </div>
              </div>

              {/* Dynamic stats */}
              <div className="space-y-2">
                {protagonist.dynamicStats.map(stat => {
                  const template = getTemplate(stat.k);
                  return (
                    <div key={stat.k}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-ink-200">{stat.k}</span>
                        <span className="text-parchment-50">{formatStat(stat, template)}</span>
                      </div>
                      {stat.t === 'progress' && template?.max && (
                        <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-600 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (Number(stat.v) / template.max) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NPCs */}
          {npcs.length > 0 && (
            <div>
              <h3 className="font-display text-sm text-ink-200 uppercase tracking-wide mb-3">Story Characters</h3>
              <div className="space-y-3">
                {npcs.map(npc => (
                  <div key={npc._id} className="flex items-center gap-2">
                    {npc.imageUrl ? (
                      <img src={npc.imageUrl} alt={npc.name} className="w-10 h-10 rounded-full object-cover border border-ink-600" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center text-sm">👤</div>
                    )}
                    <div>
                      <p className="text-parchment-50 text-sm">{npc.name}</p>
                      <p className="text-ink-200 text-xs line-clamp-1">{npc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!protagonist && !npcs.length && (
            <p className="text-ink-200 text-sm">No characters yet. Start the story to meet characters.</p>
          )}
        </div>
      </div>

      {/* Backdrop on mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
