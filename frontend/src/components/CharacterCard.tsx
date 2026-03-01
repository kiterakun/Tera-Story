import { Character } from '../services/playthroughApi';

export default function CharacterCard({ character }: { character: Character }) {
  const isProtagonist = character.role === 'protagonist';
  const initials = character.name.substring(0, 2).toUpperCase();

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Portrait */}
        <div className="w-16 h-16 rounded-md bg-ink-950 flex-shrink-0 flex items-center justify-center overflow-hidden border border-ink-700">
          {character.imageUrl ? (
            <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-display text-ink-700 font-bold">{initials}</span>
          )}
        </div>
        
        {/* Header Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-ink-200 text-lg truncate pr-2">{character.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${isProtagonist ? 'bg-accent-600/20 text-accent-400 border border-accent-600/30' : 'bg-ink-700 text-ink-200'}`}>
              {isProtagonist ? 'Protagonist' : 'NPC'}
            </span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs text-ink-200/70 font-sans">Lv. {character.level}</span>
             <span className="text-xs border border-ink-700 px-1.5 py-0.5 rounded text-red-400">HP {character.health}</span>
             <span className="text-xs border border-ink-700 px-1.5 py-0.5 rounded text-blue-400">MP {character.mana}</span>
          </div>
        </div>
      </div>

      {character.description && (
        <p className="text-sm font-serif text-ink-200/80 line-clamp-2">
          {character.description}
        </p>
      )}

      {/* Dynamic Stats Grid */}
      {character.dynamicStats.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {character.dynamicStats.map((stat) => (
            <div key={stat.k} className="flex justify-between items-center bg-ink-950/50 rounded px-2 py-1">
              <span className="text-ink-200/60 font-sans capitalize">{stat.k}</span>
              <span className="text-ink-200 font-mono">{stat.v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
