import { X } from 'lucide-react';
import type { ThreadNode } from '../../services/fateThreadsApi';

import { useTranslation } from '../../i18n';

interface ChapterDetailPanelProps {
  isOpen: boolean;
  node: ThreadNode | null;
  onClose: () => void;
}

export function ChapterDetailPanel({
  isOpen,
  node,
  onClose,
}: ChapterDetailPanelProps) {
  const t = useTranslation();
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[400px] max-w-full bg-ink-900 border-l border-ink-700 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {node && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 p-5 border-b border-ink-700">
              <div>
                <h2 className="text-lg font-bold text-gold">{node.title}</h2>
                <p className="text-xs text-ink-400 mt-1">
                  {t.fateThreads.arcLabel.replace('{index}', String(node.arcIndex + 1))} &middot; {t.fateThreads.chapterLabel.replace('{index}', String(node.chapterIndex + 1))}
                  {node.isCurrentPath && (
                    <span className="ml-2 inline-block rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
                      {t.fateThreads.currentPath}
                    </span>
                  )}
                  {!node.isCurrentPath && (
                    <span className="ml-2 inline-block rounded-full bg-ink-800 px-2 py-0.5 text-xs text-ink-400">
                      {t.fateThreads.unselectedBranch}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-full bg-ink-800 p-1.5 text-ink-400 hover:bg-ink-700 hover:text-ink-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-2">
                  {t.fateThreads.summary}
                </h3>
                <p className="text-sm leading-relaxed text-narration whitespace-pre-line">
                  {node.summary || t.fateThreads.noContent}
                </p>
              </div>

              {node.isCompleted && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <p className="text-xs text-emerald-400">{t.fateThreads.completedChapter}</p>
                </div>
              )}

              {!node.isCompleted && node.isCurrentPath && (
                <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2">
                  <p className="text-xs text-gold">{t.fateThreads.currentArc}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-5 border-t border-ink-700">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg border border-ink-600 text-ink-300 hover:bg-ink-800 transition-colors text-sm"
              >
                {t.fateThreads.close}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
