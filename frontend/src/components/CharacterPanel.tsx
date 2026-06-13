import { useState } from 'react';
import { Swords, UserRound, Users } from 'lucide-react';
import { useTranslation } from '../i18n';
import { getImageUrl } from '../utils/url';
import { RetryImageButton } from './RetryImageButton';
import { DynamicStatList } from './DynamicStatDisplay';
import { Drawer, DrawerBody } from '../design-system';
import type { DynamicStat, ResourceTemplate } from '@/types/entities';

export interface CharacterPanel {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  role: 'protagonist' | 'npc';
  dynamicStats: DynamicStat[];
}

export interface CharacterPanelProps {
  protagonist: CharacterPanel | null;
  npcs: CharacterPanel[];
  resourceTemplates: ResourceTemplate[];
}

export function CharacterPanel({ protagonist, npcs, resourceTemplates }: CharacterPanelProps) {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t.characterPanel.title}
        aria-expanded={isOpen}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-ink-800 border border-ink-700 rounded-l-xl p-3 hover:border-accent-400/50 transition-all duration-200 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Swords size={18} className="text-ink-100" aria-hidden="true" />
      </button>

      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t.characterPanel.characters}
        side="right"
        width="md"
      >
        <DrawerBody className="space-y-5">
          {protagonist && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                {protagonist.imageUrl ? (
                  <img
                    src={getImageUrl(protagonist.imageUrl)}
                    alt={protagonist.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-accent-400/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-ink-700/50 border border-ink-600 flex flex-col items-center justify-center gap-0.5">
                    <UserRound size={20} className="text-ink-200/60" aria-hidden="true" />
                    <RetryImageButton entityType="character" entityId={protagonist._id} />
                  </div>
                )}
                <div>
                  <h3 className="font-display text-ink-100">{protagonist.name}</h3>
                  <span className="text-xs text-accent-400 uppercase tracking-wide font-medium">
                    {t.characterPanel.protagonist}
                  </span>
                </div>
              </div>
              <DynamicStatList stats={protagonist.dynamicStats} templates={resourceTemplates} />
            </div>
          )}

          {npcs.length > 0 && (
            <div>
              <h3 className="font-display text-xs text-ink-200/60 uppercase tracking-wider mb-3">
                {t.characterPanel.storyCharacters}
              </h3>
              <div className="space-y-3">
                {npcs.map((npc) => (
                  <div key={npc._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-ink-800/50 transition-colors">
                    {npc.imageUrl ? (
                      <img
                        src={getImageUrl(npc.imageUrl)}
                        alt={npc.name}
                        className="w-10 h-10 rounded-lg object-cover border border-ink-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-ink-700/50 border border-ink-600 flex flex-col items-center justify-center gap-0.5">
                        <Users size={14} className="text-ink-200/60" aria-hidden="true" />
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

          {!protagonist && npcs.length === 0 && (
            <p className="text-ink-200/40 text-sm">{t.characterPanel.noCharacters}</p>
          )}
        </DrawerBody>
      </Drawer>
    </>
  );
}
