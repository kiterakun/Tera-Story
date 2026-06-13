import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { StoryContent, type EntityRef } from './StoryContent';

interface ChapterStatusOverlayProps {
  status: 'generating-first' | 'generating-next' | 'failed' | 'tools-running' | 'tools-failed' | 'retrying-tools' | 'generic-error';
  isStreaming?: boolean;
  streamingText?: string;
  streamPhase?: string;
  error?: string | null;
  onRetry?: () => void;
  onRetryTools?: () => void;
  onEntityClick?: (ref: EntityRef) => void;
}

export function ChapterStatusOverlay({
  status,
  isStreaming,
  streamingText,
  streamPhase,
  error,
  onRetry,
  onRetryTools,
  onEntityClick,
}: ChapterStatusOverlayProps) {
  const t = useTranslation();

  // Generating states (first chapter or next chapter)
  if (status === 'generating-first' || status === 'generating-next') {
    return (
      <div className={`border-l-2 border-accent-400/30 pl-5 py-6 ${status === 'generating-first' ? 'mt-4' : 'mt-8'} bg-accent-400/[0.03] rounded-r-2xl animate-fade-in`}>
        {isStreaming && streamingText ? (
          <div className="text-ink-200/90">
            <div className="flex items-center gap-2 mb-3">
              <Spinner size="sm" className="w-4 h-4 text-accent-400" />
              <span className="text-xs font-sans text-accent-400 font-medium">
                {streamPhase === 'tools' ? t.storyReader.streamPhaseTools : t.storyReader.streamingChapter}
              </span>
            </div>
            <StoryContent text={streamingText} onEntityClick={onEntityClick} />
            <span className="inline-block w-0.5 h-4 bg-accent-400 animate-pulse ml-0.5 align-middle" />
          </div>
        ) : (
          <div className="flex items-center gap-3 text-ink-200/60">
            <Spinner size="lg" className="w-5 h-5 text-accent-400" />
            <div>
              <p className="text-sm font-sans font-medium text-ink-100">
                {streamPhase === 'context' ? 'Analyzing world and story state...' : t.storyReader.generatingChapter}
              </p>
              <p className="text-xs font-sans text-ink-200/50 mt-0.5">{t.storyReader.generatingHint}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Failed chapter
  if (status === 'failed') {
    return (
      <div className="border-l-2 border-red-400/30 pl-5 py-6 mt-4 bg-red-400/[0.03] rounded-r-2xl animate-fade-in">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-sans font-medium text-red-300">{t.storyReader.generationFailed}</p>
            <p className="text-xs font-sans text-ink-200/50 mt-1">{error || t.storyReader.generationFailedHint}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-red-500/20 hover:border-red-500/30"
              >
                <RefreshCw size={14} />
                {t.storyReader.retryGeneration}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tools running
  if (status === 'tools-running') {
    return (
      <div className="border-l-2 border-blue-400/30 pl-5 py-4 mt-4 bg-blue-400/[0.03] rounded-r-2xl animate-fade-in">
        <div className="flex items-center gap-3 text-ink-200/60">
          <Spinner size="sm" className="w-4 h-4 text-blue-400" />
          <p className="text-sm font-sans font-medium text-blue-300">{t.storyReader.updatingGameState}</p>
        </div>
      </div>
    );
  }

  // Tools failed
  if (status === 'tools-failed') {
    return (
      <div className="border-l-2 border-amber-400/30 pl-5 py-5 mt-4 bg-amber-400/[0.03] rounded-r-2xl animate-fade-in">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-sans font-medium text-amber-300">{t.storyReader.toolsFailedTitle}</p>
            <p className="text-xs font-sans text-ink-200/50 mt-1">{t.storyReader.toolsFailedHint}</p>
            {onRetryTools && (
              <button
                onClick={onRetryTools}
                className="inline-flex items-center gap-2 mt-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-amber-500/20 hover:border-amber-500/30"
              >
                <RefreshCw size={14} />
                {t.storyReader.retryTools}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Retrying tools
  if (status === 'retrying-tools') {
    return (
      <div className="border-l-2 border-blue-400/30 pl-5 py-4 mt-4 bg-blue-400/[0.03] rounded-r-2xl animate-fade-in">
        <div className="flex items-center gap-3">
          <Spinner size="sm" className="w-4 h-4 text-blue-400" />
          <p className="text-sm font-sans font-medium text-blue-300">{t.storyReader.retryingTools}</p>
        </div>
      </div>
    );
  }

  // Generic error
  if (status === 'generic-error') {
    return (
      <div className="border-l-2 border-amber-400/30 pl-5 py-4 mt-4 bg-amber-400/[0.03] rounded-r-2xl animate-fade-in">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle size={16} />
          <p className="text-sm font-sans">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}
