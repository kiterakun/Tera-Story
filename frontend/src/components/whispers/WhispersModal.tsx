import { useEffect, type FC } from 'react';
import type { WhisperItem } from '../../hooks/useWhispers';
import { Users, Mail, BookOpen, Newspaper, X } from 'lucide-react';

interface WhispersModalProps {
  isOpen: boolean;
  whispers: WhisperItem[];
  daysAway: number;
  onClose: () => void;
  onContinue: () => void;
  isLoading?: boolean;
}

const whisperIcons: Record<string, typeof Users> = {
  rumor: Users,
  letter: Mail,
  diary: BookOpen,
  news: Newspaper,
};

const whisperTitles: Record<string, string> = {
  rumor: 'Rumor',
  letter: 'Letter',
  diary: 'Diary Entry',
  news: 'World News',
};

export const WhispersModal: FC<WhispersModalProps> = ({
  isOpen,
  whispers,
  daysAway,
  onClose,
  onContinue,
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/90" onClick={onClose} />
      <div className="relative bg-ink-900 border border-ink-700 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
        <div className="sticky top-0 bg-ink-900 border-b border-ink-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-100">While you were away...</h2>
            <p className="text-sm text-ink-400">{daysAway} day{daysAway !== 1 ? 's' : ''} passed in the world</p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-ink-800 rounded-lg p-4">
                <div className="h-3 bg-ink-700 rounded w-1/4 mb-2" />
                <div className="h-4 bg-ink-700 rounded w-full" />
              </div>
            ))
          ) : whispers.length === 0 ? (
            <p className="text-center text-ink-500 py-8">The world rests quietly. Nothing of note happened.</p>
          ) : (
            whispers.map((w, i) => {
              const Icon = whisperIcons[w.type] ?? BookOpen;
              return (
                <div
                  key={i}
                  className="bg-ink-800/50 border border-ink-700/50 rounded-lg p-4 animate-[fadeIn_0.5s_ease-out]"
                  style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gold shrink-0" />
                    <span className="text-xs font-medium text-gold uppercase tracking-wide">
                      {whisperTitles[w.type]}
                    </span>
                  </div>
                  <p className="text-sm text-ink-200 leading-relaxed">{w.content}</p>
                  {w.attribution && (
                    <p className="text-xs text-ink-500 mt-1">— {w.attribution}</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="sticky bottom-0 bg-ink-900 border-t border-ink-800 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-ink-400 hover:text-ink-200 border border-ink-700 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 text-sm bg-gold text-ink-950 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
