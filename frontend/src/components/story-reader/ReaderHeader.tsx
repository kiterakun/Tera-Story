import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface ReaderHeaderProps {
  currentChapterIdx: number;
  totalChapters: number;
  isOnLatest: boolean;
  onGoToChapter: (idx: number) => void;
  onGoToLatest: () => void;
}

export function ReaderHeader({
  currentChapterIdx,
  totalChapters,
  isOnLatest,
  onGoToChapter,
  onGoToLatest
}: ReaderHeaderProps) {
  const t = useTranslation();

  return (
    <div className="flex items-center justify-between mb-8 font-sans">
      <button
        onClick={() => onGoToChapter((isOnLatest ? totalChapters - 1 : currentChapterIdx) - 1)}
        disabled={isOnLatest ? totalChapters <= 1 : currentChapterIdx <= 0}
        className="p-2 rounded-xl text-ink-200/60 hover:text-ink-100 hover:bg-ink-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={t.storyReader.prevChapter}
      >
        <ChevronLeft size={20} />
      </button>
      <h3 className="font-display text-sm text-ink-200/60 uppercase tracking-wider">
        {t.storyNav.chapter} {(isOnLatest ? totalChapters : currentChapterIdx + 1)}{totalChapters > 0 ? ` / ${totalChapters}` : ''}
      </h3>
      <button
        onClick={() => {
          const next = (isOnLatest ? totalChapters - 1 : currentChapterIdx) + 1;
          if (next >= totalChapters - 1) onGoToLatest();
          else onGoToChapter(next);
        }}
        disabled={isOnLatest}
        className="p-2 rounded-xl text-ink-200/60 hover:text-ink-100 hover:bg-ink-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={t.storyReader.nextChapter}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
