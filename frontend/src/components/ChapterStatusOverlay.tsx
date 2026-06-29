import { useState } from 'react';
import { RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Settings, ScrollText } from 'lucide-react';
import { useTranslation } from '../i18n';
import { StoryContent, type EntityRef } from './StoryContent';
import { Spinner } from '../design-system/Spinner';
import type { GenerationState, EventLogEntry } from '../services/storyApi';

interface ChapterStatusOverlayProps {
  status: 'generating-first' | 'generating-next' | 'failed' | 'tools-running' | 'tools-failed' | 'retrying-tools' | 'generic-error' | 'awaiting-user';
  isStreaming?: boolean;
  streamingText?: string;
  streamPhase?: string;
  error?: string | null;
  generationState?: GenerationState | null;
  recentEvents?: EventLogEntry[];
  onRetry?: () => void;
  onRetryTools?: () => void;
  onResume?: () => void;
  onViewLogs?: () => void;
  onChangeSettings?: () => void;
  onEntityClick?: (ref: EntityRef) => void;
}

function phaseLabelKey(phase?: string): string {
  switch (phase) {
    case 'context': return 'phaseContext';
    case 'writing': return 'phaseWriting';
    case 'tools': return 'phaseTools';
    case 'post_effects': return 'phasePostEffects';
    case 'travel': return 'phaseTravel';
    case 'complete': return 'phaseComplete';
    default: return 'phaseWriting';
  }
}

export function ChapterStatusOverlay({
  status,
  isStreaming,
  streamingText,
  streamPhase,
  error,
  generationState,
  recentEvents,
  onRetry,
  onRetryTools,
  onResume,
  onViewLogs,
  onChangeSettings,
  onEntityClick,
}: ChapterStatusOverlayProps) {
  const t = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  // Generating states (first chapter or next chapter)
  if (status === 'generating-first' || status === 'generating-next') {
    const phaseKey = phaseLabelKey(streamPhase);
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
                {(t.storyReader as Record<string, string>)[phaseKey] ?? t.storyReader.generatingChapter}
              </p>
              <p className="text-xs font-sans text-ink-200/50 mt-0.5">{t.storyReader.generatingHint}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Awaiting user (auto-retries exhausted)
  if (status === 'awaiting-user') {
    const failedPhase = generationState?.error?.failedPhase;
    const attemptCount = failedPhase
      ? generationState?.phases.find((p) => p.phase === failedPhase)?.attempts ?? 0
      : 0;
    const maxAttempts = failedPhase
      ? generationState?.phases.find((p) => p.phase === failedPhase)?.maxAttempts ?? 0
      : 0;

    return (
      <div className="border-l-2 border-red-400/30 pl-5 py-6 mt-4 bg-red-400/[0.03] rounded-r-2xl animate-fade-in">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-sans font-medium text-red-300">{t.storyReader.generationErrorTitle}</p>
            <p className="text-xs font-sans text-ink-200/50 mt-1">
              {t.storyReader.generationErrorHint}
            </p>

            {attemptCount > 0 && maxAttempts > 0 && (
              <p className="text-xs font-sans text-ink-200/40 mt-1">
                {t.storyReader.attemptNofM
                  .replace('{attempt}', String(attemptCount))
                  .replace('{max}', String(maxAttempts))}
                {failedPhase && ` · ${(t.storyReader as Record<string, string>)[phaseLabelKey(failedPhase)] ?? failedPhase}`}
              </p>
            )}

            {error && (
              <p className="text-xs font-mono text-red-300/70 mt-2 break-words">{error}</p>
            )}

            {showDetails && recentEvents && recentEvents.length > 0 && (
              <div className="mt-3 space-y-1 max-h-40 overflow-y-auto pr-2">
                {recentEvents.map((ev) => (
                  <div key={ev._id} className="text-xs font-sans flex items-start gap-2">
                    <span className={
                      ev.severity === 'error' ? 'text-red-400' :
                      ev.severity === 'warning' ? 'text-amber-400' :
                      ev.severity === 'success' ? 'text-emerald-400' : 'text-ink-200/50'
                    }>●</span>
                    <span className="text-ink-200/60">{ev.title}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {onResume && (
                <button
                  onClick={onResume}
                  className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-red-500/20 hover:border-red-500/30"
                >
                  <RefreshCw size={14} />
                  {t.storyReader.generationErrorResume}
                </button>
              )}
              {onChangeSettings && (
                <button
                  onClick={onChangeSettings}
                  className="inline-flex items-center gap-2 bg-ink-200/5 hover:bg-ink-200/10 text-ink-200/70 hover:text-ink-100 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-ink-200/10 hover:border-ink-200/20"
                >
                  <Settings size={14} />
                  {t.storyReader.generationErrorChangeSettings}
                </button>
              )}
              {onViewLogs && (
                <button
                  onClick={onViewLogs}
                  className="inline-flex items-center gap-2 bg-ink-200/5 hover:bg-ink-200/10 text-ink-200/70 hover:text-ink-100 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-ink-200/10 hover:border-ink-200/20"
                >
                  <ScrollText size={14} />
                  {t.storyReader.generationErrorLogs}
                </button>
              )}
              {recentEvents && recentEvents.length > 0 && (
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-sans text-ink-200/40 hover:text-ink-200/60 transition-colors ml-1"
                >
                  {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showDetails ? t.storyReader.generationErrorHideDetails : t.storyReader.generationErrorShowDetails}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed chapter (legacy)
  if (status === 'failed') {
    return (
      <div className="border-l-2 border-red-400/30 pl-5 py-6 mt-4 bg-red-400/[0.03] rounded-r-2xl animate-fade-in">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-sans font-medium text-red-300">{t.storyReader.generationFailed}</p>
            <p className="text-xs font-sans text-ink-200/50 mt-1">{error || t.storyReader.generationFailedHint}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-red-500/20 hover:border-red-500/30"
                >
                  <RefreshCw size={14} />
                  {t.storyReader.retryGeneration}
                </button>
              )}
              {onChangeSettings && (
                <button
                  onClick={onChangeSettings}
                  className="inline-flex items-center gap-2 bg-ink-200/5 hover:bg-ink-200/10 text-ink-200/70 hover:text-ink-100 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-ink-200/10 hover:border-ink-200/20"
                >
                  <Settings size={14} />
                  {t.storyReader.generationErrorChangeSettings}
                </button>
              )}
            </div>
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
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {onRetryTools && (
                <button
                  onClick={onRetryTools}
                  className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-amber-500/20 hover:border-amber-500/30"
                >
                  <RefreshCw size={14} />
                  {t.storyReader.retryTools}
                </button>
              )}
              {onChangeSettings && (
                <button
                  onClick={onChangeSettings}
                  className="inline-flex items-center gap-2 bg-ink-200/5 hover:bg-ink-200/10 text-ink-200/70 hover:text-ink-100 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-ink-200/10 hover:border-ink-200/20"
                >
                  <Settings size={14} />
                  {t.storyReader.generationErrorChangeSettings}
                </button>
              )}
            </div>
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
