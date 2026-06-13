import type { ThreadNode } from '../../services/fateThreadsApi';

import { useTranslation } from '../../i18n';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '../../design-system';

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
    <Drawer
      open={isOpen}
      onClose={onClose}
      side="right"
      width="md"
      className="w-[400px] max-w-full border-l border-ink-700"
    >
      {node && (
        <>
          <DrawerHeader>
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
          </DrawerHeader>

          <DrawerBody className="p-5">
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
          </DrawerBody>

          <DrawerFooter>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg border border-ink-600 text-ink-300 hover:bg-ink-800 transition-colors text-sm"
            >
              {t.fateThreads.close}
            </button>
          </DrawerFooter>
        </>
      )}
    </Drawer>
  );
}
