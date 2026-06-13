import type { Character } from '../services/playthroughApi';
import type { ResourceTemplate } from '@/types/entities';
import { useTranslation } from '../i18n';
import { getImageUrl } from '../utils/url';
import { RetryImageButton } from './RetryImageButton';
import { DynamicStatDisplay } from './DynamicStatDisplay';
import { useStoryStore } from '../stores/storyStore';
import { EntityCard } from '../design-system/EntityCard';

export default function CharacterCard({ character }: { character: Character }) {
  const t = useTranslation();
  const world = useStoryStore((state) => state.world);
  const isProtagonist = character.role === 'protagonist';
  const initials = character.name.substring(0, 2).toUpperCase();
  const roleLabel = isProtagonist ? t.characterCard.protagonist : t.characterCard.npc;
  const statusLabel = t.entityStatus[character.status as keyof typeof t.entityStatus] || character.status;

  return (
    <EntityCard
      variant="character"
      name={character.name}
      subtitle={roleLabel}
      description={character.description}
      imageUrl={character.imageUrl ? getImageUrl(character.imageUrl) : undefined}
      imageAlt={character.name}
      imageFallback={(
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-lg font-display text-ink-500 font-bold">{initials}</span>
          <RetryImageButton entityType="character" entityId={character._id} />
        </span>
      )}
      status={character.status}
      statusLabel={statusLabel}
      className="bg-ink-800 p-4"
    >
      {character.dynamicStats.length > 0 && (
        <span className="mt-2 grid grid-cols-2 gap-1.5">
          {character.dynamicStats.map((stat, idx) => (
            <span key={idx} className="bg-ink-950/50 rounded-lg px-2.5 py-1.5">
              <DynamicStatDisplay
                stat={stat}
                template={world?.resourceTemplates?.find((tmpl: ResourceTemplate) => tmpl.key === stat.k)}
                compact
              />
            </span>
          ))}
        </span>
      )}

      {(character.background || character.personality || character.goals || character.appearance) && (
        <details className="group mt-2">
          <summary className="text-xs text-ink-200/50 cursor-pointer hover:text-ink-200/80 transition-colors">
            {t.characterPanel.details}
          </summary>
          <div className="mt-2 space-y-2 text-xs text-ink-200/70">
            {character.background && (
              <p><span className="text-ink-200/50">{t.characterPanel.background || 'Background'}:</span> {character.background}</p>
            )}
            {character.personality && (
              <p><span className="text-ink-200/50">{t.characterPanel.personality || 'Personality'}:</span> {character.personality}</p>
            )}
            {character.goals && (
              <p><span className="text-ink-200/50">{t.characterPanel.goals || 'Goals'}:</span> {character.goals}</p>
            )}
            {character.appearance && (
              <p><span className="text-ink-200/50">{t.characterPanel.appearance || 'Appearance'}:</span> {character.appearance}</p>
            )}
          </div>
        </details>
      )}
    </EntityCard>
  );
}
