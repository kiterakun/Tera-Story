import { AlertTriangle, ChevronLeft, Scissors, Zap } from 'lucide-react';
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
  t,
}: ChapterNavProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Chapter list */}
      <div className="space-y-1 flex-1 overflow-y-auto mb-4">
        {chapters.map((ch, idx) => (
          <button
            key={ch._id}
            onClick={() => goToChapter(idx)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              (isOnLatest && idx === totalChapters - 1) || (!isOnLatest && idx === currentChapterIdx)
                ? 'bg-accent-600/20 text-accent-400 border border-accent-400/30'
                : 'text-ink-200/70 hover:bg-ink-800/50 hover:text-ink-100'
            }`}
          >
            <span className="flex items-center gap-2">
              {t.storyNav.chapter} {idx + 1}
              {ch.status === 'failed' && <AlertTriangle size={12} className="text-red-400" />}
            </span>
          </button>
        ))}
        {chapters.length === 0 && (
          <p className="text-sm text-ink-200/40 italic">{t.storyReader.navigationPanel}</p>
        )}
      </div>
      {/* Context tokens + Summarize Arc */}
      {contextTokens !== null && chapters.length > 0 && (
        <div className="border-t border-ink-700 pt-3 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[10px] text-ink-200/60 uppercase tracking-wider font-medium">{t.storyReader.contextTokens}</span>
          </div>
          <p className="text-sm font-mono text-ink-100 mb-1">{contextTokens.toLocaleString()}</p>
          <p className="text-[10px] text-ink-200/40 mb-2.5">{t.storyReader.contextTokensHint}</p>
          <button
            onClick={handleSummarizeArc}
            disabled={isSummarizingArc || isGenerating}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-xl text-xs font-sans font-medium transition-colors border border-amber-500/20 hover:border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSummarizingArc ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {t.storyReader.summarizingArc}
              </>
            ) : (
              <>
                <Scissors size={12} />
                {t.storyReader.summarizeArc}
              </>
            )}
          </button>
        </div>
      )}

      <div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-accent-400 hover:text-accent-500 text-sm transition-colors">
          <ChevronLeft size={16} />
          {t.storyReader.backToPlaythrough}
        </button>
      </div>
    </>
  );
}
