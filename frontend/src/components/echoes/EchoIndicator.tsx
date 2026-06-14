import type { FC } from 'react';
import type { EchoItem } from '../../hooks/useEchoes';
import { Radio, Zap, Clock } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface EchoIndicatorProps {
  echoes: EchoItem[];
  currentChapterIndex: number;
}

const echoTypeIcons: Record<string, typeof Radio> = {
  mercy: Radio,
  betrayal: Radio,
  discovery: Zap,
  consequence: Clock,
};

const statusColors: Record<string, string> = {
  planted: 'text-ink-500',
  approaching: 'text-ink-300',
  active: 'text-gold-400 animate-pulse',
  resolved: 'text-ink-600 line-through',
};

export const EchoIndicator: FC<EchoIndicatorProps> = ({ echoes, currentChapterIndex }) => {
  const t = useTranslation();
  const relevantEchoes = echoes.filter(
    (e) => e.targetChapterIndex <= currentChapterIndex + 5 && e.status !== 'resolved'
  );

  if (relevantEchoes.length === 0) return null;

  return (
    <div className="bg-ink-800/50 border border-ink-700 rounded-lg p-3 space-y-2">
      <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">{t.echoes.indicatorTitle}</p>
      {relevantEchoes.slice(0, 3).map((echo) => {
        const Icon = echoTypeIcons[echo.type] ?? Clock;
        const chaptersUntil = echo.targetChapterIndex - currentChapterIndex;
        return (
          <div key={echo._id} className={`flex items-center gap-2 text-xs ${statusColors[echo.status]}`}>
            <Icon className="w-3 h-3 shrink-0" />
            <span className="flex-1 truncate">{echo.description}</span>
            {echo.status !== 'active' && (
              <span className="text-ink-500 shrink-0">
                {chaptersUntil > 0 
                  ? t.echoes.inChapters.replace('{count}', String(chaptersUntil)) 
                  : t.echoes.now}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
