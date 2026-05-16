import { UserRound } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface ProtagonistGuardProps {
  worldId: string;
  playthroughId: string;
  onNavigate: (path: string) => void;
}

export function ProtagonistGuard({ worldId, playthroughId, onNavigate }: ProtagonistGuardProps) {
  const t = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-ink-950">
      <div className="text-center max-w-md px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-accent-600/10 border border-accent-600/20 flex items-center justify-center mx-auto mb-6">
          <UserRound size={36} className="text-accent-400" />
        </div>
        <h2 className="font-display text-2xl text-ink-100 mb-3">{t.playthrough.createProtagonist}</h2>
        <p className="text-ink-200/60 text-sm mb-8">{t.playthrough.createProtagonistRequired}</p>
        <button
          onClick={() => onNavigate(`/worlds/${worldId}/playthroughs/${playthroughId}/characters/create?role=protagonist`)}
          className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-8 py-3.5 rounded-2xl font-display text-base transition-all duration-200 shadow-lg hover:shadow-accent-600/30"
        >
          {t.playthrough.createProtagonist}
        </button>
      </div>
    </div>
  );
}
