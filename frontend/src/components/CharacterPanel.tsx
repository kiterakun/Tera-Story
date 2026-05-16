import { useState } from 'react';
import { Swords, UserRound, Users, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { getImageUrl } from '../utils/url';
import { RetryImageButton } from './RetryImageButton';

export interface DynamicStat {
  k: string;
  v: string | number | boolean;
  t: string;
  maxV?: number;
  children?: DynamicStat[];
}

export interface ResourceTemplate {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum' | 'pool' | 'object';
  min?: number;
  max?: number;
  displayFormat?: string;
  options?: string[];
  children?: ResourceTemplate[];
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
  resourceTemplates: ResourceTemplate[];
}

export function CharacterPanel({ protagonist, npcs, resourceTemplates }: CharacterPanelProps) {
  const t = useTranslation();
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
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-ink-800 border border-ink-700 rounded-l-xl p-3 hover:border-accent-400/50 transition-all duration-200 shadow-lg"
        title={t.characterPanel.title}
      >
        <Swords size={18} className="text-ink-100" />
      </button>

      {/* Panel drawer */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-ink-900 border-l border-ink-700 z-20 transform transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-display text-lg text-ink-100">{t.characterPanel.characters}</h2>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Protagonist */}
          {protagonist && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {protagonist.imageUrl ? (
                  <img src={getImageUrl(protagonist.imageUrl)} alt={protagonist.name} className="w-14 h-14 rounded-xl object-cover border-2 border-accent-400/30" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-ink-700/50 border border-ink-600 flex flex-col items-center justify-center gap-0.5">
                    <UserRound size={20} className="text-ink-200/60" />
                    <RetryImageButton entityType="character" entityId={protagonist._id} />
                  </div>
                )}
                <div>
                  <h3 className="font-display text-ink-100">{protagonist.name}</h3>
                  <span className="text-xs text-accent-400 uppercase tracking-wide font-medium">{t.characterPanel.protagonist}</span>
                </div>
              </div>

              {/* Dynamic stats */}
              <div className="space-y-2">
                {protagonist.dynamicStats.map(stat => {
                  const template = getTemplate(stat.k);
                  const isEnumInvalid = stat.t === 'enum' && template?.options && !template.options.includes(String(stat.v));
                  return (
                    <div key={stat.k}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-ink-200/70 text-xs">{stat.k}</span>
                        <span className={`text-xs font-mono flex items-center gap-1 ${isEnumInvalid ? 'text-red-400 border border-red-500/40 rounded px-1 -mx-1' : 'text-ink-100'}`}>
                          {formatStat(stat, template)}
                          {isEnumInvalid && <AlertTriangle size={12} className="text-red-400 shrink-0" title={`Valid: ${template?.options?.join(', ')}`} />}
                        </span>
                      </div>
                      {stat.t === 'progress' && template?.max && (
                        <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-600 rounded-full transition-all duration-500"
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
              <h3 className="font-display text-xs text-ink-200/60 uppercase tracking-wider mb-3">{t.characterPanel.storyCharacters}</h3>
              <div className="space-y-3">
                {npcs.map(npc => (
                  <div key={npc._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-ink-800/50 transition-colors">
                    {npc.imageUrl ? (
                      <img src={getImageUrl(npc.imageUrl)} alt={npc.name} className="w-10 h-10 rounded-lg object-cover border border-ink-600" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-ink-700/50 border border-ink-600 flex flex-col items-center justify-center gap-0.5">
                        <Users size={14} className="text-ink-200/60" />
                        <RetryImageButton entityType="character" entityId={npc._id} />
                      </div>
                    )}
                    <div>
                      <p className="text-ink-100 text-sm">{npc.name}</p>
                      <p className="text-ink-200/50 text-xs line-clamp-1">{npc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!protagonist && !npcs.length && (
            <p className="text-ink-200/40 text-sm">{t.characterPanel.noCharacters}</p>
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
