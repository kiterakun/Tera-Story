import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AlertTriangle, ChevronLeft, Scissors, Zap, Check, Sparkles } from 'lucide-react';
import { Spinner, cn } from '../design-system';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

interface Chapter {
  _id: string;
  content: string;
  chapterIndex: number;
  choices: Choice[];
  status?: 'generating' | 'completed' | 'failed';
  toolsStatus?: 'pending' | 'running' | 'completed' | 'failed';
  playerChoice?: string;
  metadata?: {
    contextTokens?: number;
    tokensUsed?: number;
  };
}

interface Choice {
  text: string;
  type: 'continue' | 'new_arc' | 'custom';
}

interface ChapterNavProps {
  chapters: Chapter[];
  goToChapter: (idx: number) => void;
  isOnLatest: boolean;
  currentChapterIdx: number;
  totalChapters: number;
  contextTokens: number | null;
  handleSummarizeArc: () => void;
  isSummarizingArc: boolean;
  isGenerating: boolean;
  t: ReturnType<typeof useTranslation>;
  activeChapter: Chapter | undefined;
  isLatestFailed: boolean;
  isLatestToolsFailed: boolean;
  isNewGame: boolean;
  handleBeginStory: () => void;
}

export default function ChapterNav({
  chapters,
  goToChapter,
  isOnLatest,
  currentChapterIdx,
  totalChapters,
  contextTokens,
  handleSummarizeArc,
  isSummarizingArc,
  isGenerating,
  t: tProp,
}: ChapterNavProps) {
  const fallbackT = useTranslation();
  const t = tProp ?? fallbackT;
  const navigate = useNavigate();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(() => {
    // Default focus to currently active chapter
    if (isOnLatest) return Math.max(0, totalChapters - 1);
    return currentChapterIdx;
  });

  // Sync focused index when active chapter changes (e.g., user reads forward).
  // Sync state from props (recommended pattern when prop → state).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const idx = isOnLatest ? Math.max(0, totalChapters - 1) : currentChapterIdx;
    setFocusedIndex(idx);
  }, [currentChapterIdx, isOnLatest, totalChapters]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keyboard navigation within chapter list (roving tabindex)
  const handleChapterKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const count = chapters.length;
    if (count === 0) return;
    let next = focusedIndex;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        next = (focusedIndex + 1) % count;
        break;
      case 'ArrowUp':
        e.preventDefault();
        next = (focusedIndex - 1 + count) % count;
        break;
      case 'Home':
        e.preventDefault();
        next = 0;
        break;
      case 'End':
        e.preventDefault();
        next = count - 1;
        break;
      default:
        return;
    }
    setFocusedIndex(next);
    buttonRefs.current[next]?.focus();
  };

  return (
    <>
      {/* Chapter list */}
      <div
        role="listbox"
        aria-label={t.storyReader.storyNavigation}
        className="space-y-1 flex-1 overflow-y-auto mb-4"
      >
        {chapters.map((ch, idx) => {
          const isActive = (isOnLatest && idx === totalChapters - 1) ||
            (!isOnLatest && idx === currentChapterIdx);
          const isFocused = focusedIndex === idx;
          const isCompleted = ch.status === 'completed' || (ch.choices && ch.choices.length > 0 && !isActive);
          const isFailed = ch.status === 'failed';
          return (
            <button
              key={ch._id}
              ref={(el) => { buttonRefs.current[idx] = el; }}
              type="button"
              role="option"
              aria-selected={isActive}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => goToChapter(idx)}
              onFocus={() => setFocusedIndex(idx)}
              onKeyDown={handleChapterKey}
              disabled={isGenerating}
              className={cn(
                'w-full text-left px-3 py-2 rounded-xl text-sm',
                'transition-all duration-base ease-standard',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isActive
                  ? 'bg-accent-600/20 text-accent-400 border border-accent-400/30 font-medium'
                  : 'text-ink-200/70 hover:bg-ink-800/50 hover:text-ink-100 border border-transparent',
              )}
            >
              <span className="flex items-center gap-2">
                {isCompleted && (
                  <Check size={12} className="text-emerald-400 shrink-0" aria-hidden="true" />
                )}
                {isFailed && (
                  <AlertTriangle size={12} className="text-red-400 shrink-0" aria-hidden="true" />
                )}
                {ch.status === 'generating' && (
                  <Spinner size="sm" className="w-3 h-3 text-accent-400 shrink-0" />
                )}
                {!isCompleted && !isFailed && ch.status !== 'generating' && (
                  <Sparkles size={12} className="text-ink-500/60 shrink-0" aria-hidden="true" />
                )}
                <span className="flex-1">
                  {t.storyNav.chapter} {idx + 1}
                </span>
              </span>
            </button>
          );
        })}
        {chapters.length === 0 && (
          <p className="text-sm text-ink-200/40 italic">{t.storyReader.navigationPanel}</p>
        )}
      </div>

      {/* Context tokens + Summarize Arc */}
      {contextTokens !== null && chapters.length > 0 && (
        <div className="border-t border-ink-700 pt-3 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={12} className="text-amber-400" aria-hidden="true" />
            <span className="text-[10px] text-ink-200/60 uppercase tracking-wider font-medium">
              {t.storyReader.contextTokens}
            </span>
          </div>
          <p className="text-sm font-mono text-ink-100 mb-1">{contextTokens.toLocaleString()}</p>
          <p className="text-[10px] text-ink-200/40 mb-2.5">{t.storyReader.contextTokensHint}</p>
          <button
            type="button"
            onClick={handleSummarizeArc}
            disabled={isSummarizingArc || isGenerating}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors duration-base ease-standard border border-amber-500/20 hover:border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {isSummarizingArc ? (
              <>
                <Spinner size="sm" className="w-3 h-3" />
                {t.storyReader.summarizingArc}
              </>
            ) : (
              <>
                <Scissors size={12} aria-hidden="true" />
                {t.storyReader.summarizeArc}
              </>
            )}
          </button>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-accent-400 hover:text-accent-500 text-sm transition-colors duration-base ease-standard min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-lg px-2"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t.storyReader.backToPlaythrough}
        </button>
      </div>
    </>
  );
}
