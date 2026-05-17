import { X, Loader2 } from 'lucide-react';
import type { PeekResponse } from '../../services/fateThreadsApi';
import { useTranslation } from '../../i18n';

interface PeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  peekResult: PeekResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function PeekModal({
  isOpen,
  onClose,
  onContinue,
  peekResult,
  isLoading,
  error,
}: PeekModalProps) {
  const t = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-ink-700 bg-ink-900 shadow-2xl transition-all duration-200 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full bg-ink-800 p-1.5 text-ink-400 hover:bg-ink-700 hover:text-ink-200 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold text-gold mb-4">
            {t.fateThreads.peekTitle}
          </h2>

          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={32} className="animate-spin text-gold" />
              <p className="text-sm text-ink-400">
                {t.fateThreads.peekLoading}
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="py-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {peekResult && !isLoading && (
            <div className="transition-opacity duration-300">
              <p className="text-sm leading-relaxed text-narration whitespace-pre-line">
                {peekResult.alternateDescription}
              </p>
              {peekResult.choiceText && (
                <p className="mt-3 text-xs text-ink-500 italic">
                  {t.fateThreads.peekChoicePrefix.replace('{text}', peekResult.choiceText)}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-ink-600 text-ink-300 hover:bg-ink-800 transition-colors text-sm"
            >
              {t.fateThreads.close}
            </button>
            <button
              onClick={onContinue}
              className="px-4 py-2 rounded-lg bg-gold text-ink-950 font-semibold hover:bg-gold/80 transition-colors text-sm"
            >
              {t.fateThreads.continueReading}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
