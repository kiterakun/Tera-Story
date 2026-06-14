import { useState, type FC } from 'react';
import { useEchoes, type EchoItem } from '../../hooks/useEchoes';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface EchoListProps {
  playthroughId: string;
  currentChapterIndex: number;
}


const statusBadges: Record<string, string> = {
  planted: 'bg-ink-700 text-ink-300',
  approaching: 'bg-blue-900/50 text-blue-300',
  active: 'bg-gold-500/20 text-gold-400',
  resolved: 'bg-emerald-900/50 text-emerald-300',
};

export const EchoList: FC<EchoListProps> = ({ playthroughId }) => {
  const { echoes, pendingEchoes, isLoading } = useEchoes(playthroughId);
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const displayEchoes = expanded ? echoes : pendingEchoes;

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-10 bg-ink-800 rounded" />
        ))}
      </div>
    );
  }

  if (pendingEchoes.length === 0 && echoes.length === 0) {
    return (
      <p className="text-xs text-ink-500 text-center py-2">{t.echoes.empty}</p>
    );
  }

  return (
    <div className="space-y-2">
      {displayEchoes.map((echo: EchoItem) => (
        <div
          key={echo._id}
          className="bg-ink-800/30 border border-ink-700/50 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ink-400">{t.echoes.types[echo.type as keyof typeof t.echoes.types] ?? echo.type}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadges[echo.status]}`}>
              {t.echoes.status[echo.status as keyof typeof t.echoes.status] ?? echo.status}
            </span>
          </div>
          <p className="text-sm text-ink-200">{echo.description}</p>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-ink-500">
              Ch. {echo.triggerChapterIndex + 1} → Ch. {echo.targetChapterIndex + 1}
            </span>
            {echo.status === 'resolved' && <span className="text-xs text-emerald-400">✓ {t.echoes.resolved}</span>}
          </div>
        </div>
      ))}

      {echoes.length > pendingEchoes.length && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-ink-400 hover:text-ink-200 py-1"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> {t.echoes.showLess}</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> {t.echoes.showAll.replace('{count}', String(echoes.length))}</>
          )}
        </button>
      )}
    </div>
  );
};
