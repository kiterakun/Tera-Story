import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { cn } from '../../design-system';

interface ReaderHeaderProps {
  currentChapterIdx: number;
  totalChapters: number;
  isOnLatest: boolean;
  onGoToChapter: (idx: number) => void;
  onGoToLatest: () => void;
  /** Optional chapter title for the chapter being read. */
  chapterTitle?: string;
}

export function ReaderHeader({
  currentChapterIdx,
  totalChapters,
  isOnLatest,
  onGoToChapter,
  onGoToLatest,
  chapterTitle,
}: ReaderHeaderProps) {
  const t = useTranslation();

  // Compute current chapter number (1-indexed for display)
  const currentChapterNum = isOnLatest ? totalChapters : currentChapterIdx + 1;
  const progressPercent = totalChapters > 0
    ? Math.min(100, Math.max(0, (currentChapterNum / totalChapters) * 100))
    : 0;

  return (
    <header
      aria-label="Chapter navigation"
      className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-ink-900/85 backdrop-blur-md border-b border-ink-700/50"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
        {/* Back / Previous chapter */}
        <button
          type="button"
          onClick={() => onGoToChapter((isOnLatest ? totalChapters - 1 : currentChapterIdx) - 1)}
          disabled={isOnLatest ? totalChapters <= 1 : currentChapterIdx <= 0}
          aria-label={t.storyReader.prevChapter}
          className={cn(
            'min-h-[44px] min-w-[44px] inline-flex items-center justify-center',
            'rounded-xl px-3 text-ink-200/70 hover:text-ink-100 hover:bg-ink-800/60',
            'transition-colors duration-base ease-standard',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          )}
          title={t.storyReader.prevChapter}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Center: chapter title (mobile collapsed) + progress */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
          {chapterTitle && (
            <h3
              className={cn(
                'font-display text-sm sm:text-base text-ink-100 truncate max-w-full',
                'hidden sm:block', // hidden on mobile (<640px), shown ≥640px
              )}
              title={chapterTitle}
            >
              {chapterTitle}
            </h3>
          )}
          <div className="flex items-center gap-2 text-xs text-ink-200/60">
            <BookOpen size={12} className="shrink-0" aria-hidden="true" />
            <span className="font-sans uppercase tracking-wider whitespace-nowrap">
              {t.storyNav.chapter} {currentChapterNum}{totalChapters > 0 ? ` / ${totalChapters}` : ''}
            </span>
          </div>
        </div>

        {/* Next / Latest chapter */}
        <button
          type="button"
          onClick={() => {
            const next = (isOnLatest ? totalChapters - 1 : currentChapterIdx) + 1;
            if (next >= totalChapters - 1) onGoToLatest();
            else onGoToChapter(next);
          }}
          disabled={isOnLatest}
          aria-label={t.storyReader.nextChapter}
          className={cn(
            'min-h-[44px] min-w-[44px] inline-flex items-center justify-center',
            'rounded-xl px-3 text-ink-200/70 hover:text-ink-100 hover:bg-ink-800/60',
            'transition-colors duration-base ease-standard',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          )}
          title={t.storyReader.nextChapter}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress bar (shown when >0 chapters) */}
      {totalChapters > 0 && (
        <div
          className="mt-2 h-1 bg-ink-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalChapters}
          aria-valuenow={currentChapterNum}
          aria-label={`Chapter ${currentChapterNum} of ${totalChapters}`}
        >
          <div
            className="h-full bg-accent-500 transition-[width] duration-slow ease-standard"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </header>
  );
}
