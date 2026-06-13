import { Network } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { Character, Relationship } from '../../../services/playthroughApi';
import type { useTranslation } from '../../../i18n';

interface RelationshipsTabProps {
  relationships: Relationship[];
  characters: Character[];
  setIsRelationshipModalOpen: Dispatch<SetStateAction<boolean>>;
  t: ReturnType<typeof useTranslation>;
}

export function RelationshipsTab({
  relationships,
  characters,
  setIsRelationshipModalOpen,
  t,
}: RelationshipsTabProps) {
  if (relationships.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">{t.storyReader.noRelationships}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <button
        onClick={() => setIsRelationshipModalOpen(true)}
        className="w-full bg-ink-950/50 border border-ink-700/50 rounded-xl p-3 text-sm text-accent-400 hover:text-accent-300 hover:border-accent-600/30 transition-colors flex items-center justify-center gap-2"
      >
        <Network size={16} aria-hidden="true" />
        {t.characterPanel.viewRelationshipWeb}
      </button>

      {relationships.map((rel) => {
        const charA = characters.find((c) => c._id === rel.characterA._id) || rel.characterA;
        const charB = characters.find((c) => c._id === rel.characterB._id) || rel.characterB;
        if (!charA || !charB) return null;

        const intensityColor =
          rel.intensity > 50
            ? 'text-green-400'
            : rel.intensity < -50
              ? 'text-red-400'
              : 'text-ink-200/70';

        return (
          <div
            key={`${rel.characterA._id}-${rel.characterB._id}`}
            className="bg-ink-950/50 rounded-xl border border-ink-700/50 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-ink-100">{charA.name}</span>
                <span className="text-ink-200/40">&</span>
                <span className="text-ink-100">{charB.name}</span>
              </div>
              <span className={`text-xs font-mono ${intensityColor}`} aria-label={`Intensity ${rel.intensity}`}>
                {rel.intensity}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-ink-200/50 capitalize">{rel.type}</span>
              <div
                className="flex-1 h-1 bg-ink-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.abs(rel.intensity)}
                aria-label={`Relationship strength ${rel.intensity}`}
              >
                <div
                  className={`h-full rounded-full ${rel.intensity > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.abs(rel.intensity)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
