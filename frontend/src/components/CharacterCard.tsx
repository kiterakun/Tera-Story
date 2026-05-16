import type { Character } from '../services/playthroughApi';
import { useTranslation } from '../i18n';
import { getImageUrl } from '../utils/url';
import { RetryImageButton } from './RetryImageButton';

export default function CharacterCard({ character }: { character: Character }) {
  const t = useTranslation();
  const isProtagonist = character.role === 'protagonist';
  const initials = character.name.substring(0, 2).toUpperCase();

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-4 flex flex-col gap-3 hover:border-ink-600 transition-all duration-200">
      <div className="flex items-center gap-3">
        {/* Portrait */}
        <div className="w-14 h-14 rounded-xl bg-ink-950 shrink-0 flex items-center justify-center overflow-hidden border border-ink-700">
          {character.imageUrl ? (
            <img src={getImageUrl(character.imageUrl)} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-display text-ink-500 font-bold">{initials}</span>
              <RetryImageButton entityType="character" entityId={character._id} />
            </div>
          )}
        </div>
        
        {/* Header Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-ink-100 text-base truncate pr-2">{character.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-lg whitespace-nowrap font-medium ${
              isProtagonist 
                ? 'bg-accent-600/10 text-accent-400 border border-accent-600/20' 
                : 'bg-ink-700/50 text-ink-200/70'
            }`}>
              {isProtagonist ? t.characterCard.protagonist : t.characterCard.npc}
            </span>
          </div>
          {character.dynamicStats.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {character.dynamicStats.slice(0, 3).map((stat) => (
                <span key={stat.k} className="text-xs bg-ink-700/50 text-ink-200/70 px-1.5 py-0.5 rounded-lg">
                  {stat.k}: {stat.v}
                </span>
              ))}
              {character.dynamicStats.length > 3 && (
                <span className="text-xs text-ink-200/40">+{character.dynamicStats.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {character.description && (
        <p className="text-sm font-serif text-ink-200/70 line-clamp-2 leading-relaxed">
          {character.description}
        </p>
      )}

      {/* Dynamic Stats Grid */}
      {character.dynamicStats.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 text-sm">
          {character.dynamicStats.map((stat) => (
            <div key={stat.k} className="flex justify-between items-center bg-ink-950/50 rounded-lg px-2.5 py-1.5">
              <span className="text-ink-200/50 text-xs capitalize">{stat.k}</span>
              <span className="text-ink-100 font-mono text-xs">
                {stat.t === 'pool' && stat.maxV !== undefined
                  ? `${stat.v}/${stat.maxV}`
                  : String(stat.v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* New character fields (collapsible) */}
      {(character.background || character.personality || character.goals || character.appearance) && (
        <details className="group">
          <summary className="text-xs text-ink-200/50 cursor-pointer hover:text-ink-200/80 transition-colors">
            {t.characterPanel.protagonist === 'Protagonist' ? 'Details' : 'Chi tiết'}
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
    </div>
  );
}
