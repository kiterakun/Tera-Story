import React from 'react';
import { BookOpen } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { StoryContent, type EntityRef } from '../StoryContent';
import { ChapterStatusOverlay } from '../ChapterStatusOverlay';
import { CombatPanel } from '../CombatPanel';
import { ChoiceCards } from '../ChoiceCards';
import type { Chapter, Choice } from '../../types/story';
import type { CombatEncounter } from '../../services/playthroughApi';

interface ReaderContentProps {
  isNewGame: boolean;
  chapters: Chapter[];
  activeChapter: Chapter | null;
  latestChapter: Chapter | null;
  isGenerating: boolean;
  isStreaming: boolean;
  streamingText: string;
  streamPhase: string;
  isOnLatest: boolean;
  isLatestFailed: boolean;
  isLatestToolsFailed: boolean;
  isToolsRunning: boolean;
  isRetryingTools: boolean;
  error: string | null;
  choices: Choice[];
  playthroughId: string;
  activeCombat: CombatEncounter | null;
  showChoices: boolean;
  onBeginStory: () => void;
  onEntityClick: (entity: EntityRef) => void;
  onRetry: () => void;
  onRetryTools: () => void;
  onChoiceSelect: (text: string) => void;
  onCombatUpdate: (combat: CombatEncounter) => void;
  onCombatEnd: () => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function ReaderContent({
  isNewGame,
  chapters,
  activeChapter,
  latestChapter,
  isGenerating,
  isStreaming,
  streamingText,
  streamPhase,
  isOnLatest,
  isLatestFailed,
  isLatestToolsFailed,
  isToolsRunning,
  isRetryingTools,
  error,
  choices,
  playthroughId,
  activeCombat,
  showChoices,
  onBeginStory,
  onEntityClick,
  onRetry,
  onRetryTools,
  onChoiceSelect,
  onCombatUpdate,
  onCombatEnd,
  bottomRef
}: ReaderContentProps) {
  const t = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto">
      <article className="max-w-[65ch] mx-auto font-serif text-ink-100 leading-[1.8] text-lg py-8 px-4 md:py-16">
        {/* Begin Story — fresh playthrough with no chapters */}
        {isNewGame && chapters.length === 0 && !isGenerating && (
          <div className="text-center py-16 animate-fade-in">
            <div className="mb-6">
              <BookOpen size={48} className="mx-auto text-accent-400/60" />
            </div>
            <h2 className="font-display text-2xl text-ink-100 mb-3">{t.storyReader.beginAdventure}</h2>
            <p className="text-ink-200/60 text-base mb-8 max-w-md mx-auto">{t.storyReader.beginAdventureDesc}</p>
            <button
              onClick={onBeginStory}
              className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-8 py-3.5 rounded-2xl font-display text-base transition-all duration-200 shadow-lg hover:shadow-accent-600/30"
            >
              {t.storyReader.beginStory}
            </button>
          </div>
        )}

        {/* Current chapter content (with entity highlighting) */}
        {activeChapter && activeChapter.content && activeChapter.status !== 'failed' && (
          <div className="text-ink-200/90 animate-fade-in">
            <StoryContent
              text={activeChapter.content}
              onEntityClick={onEntityClick}
            />
          </div>
        )}

        {/* Chapter status overlays */}
        {isGenerating && (!latestChapter || !latestChapter.content) && (
          <ChapterStatusOverlay
            status="generating-first"
            isStreaming={isStreaming}
            streamingText={streamingText}
            streamPhase={streamPhase}
            onEntityClick={onEntityClick}
          />
        )}

        {isGenerating && isOnLatest && latestChapter?.content && !isToolsRunning && (
          <ChapterStatusOverlay
            status="generating-next"
            isStreaming={isStreaming}
            streamingText={streamingText}
            streamPhase={streamPhase}
            onEntityClick={onEntityClick}
          />
        )}

        {isOnLatest && isLatestFailed && !isGenerating && (
          <ChapterStatusOverlay
            status="failed"
            error={error}
            onRetry={onRetry}
          />
        )}

        {isOnLatest && activeChapter && activeChapter.content && isToolsRunning && !isRetryingTools && (
          <ChapterStatusOverlay status="tools-running" />
        )}

        {isOnLatest && isLatestToolsFailed && !isGenerating && !isRetryingTools && (
          <ChapterStatusOverlay
            status="tools-failed"
            onRetryTools={onRetryTools}
          />
        )}

        {isRetryingTools && (
          <ChapterStatusOverlay status="retrying-tools" />
        )}

        {error && !isLatestFailed && !isGenerating && (
          <ChapterStatusOverlay status="generic-error" error={error} />
        )}

        {/* Combat Panel — active combat encounter */}
        {activeCombat && activeCombat.status === 'active' && isOnLatest && !isGenerating && (
          <div className="mt-8 animate-fade-in">
            <CombatPanel
              combat={activeCombat}
              onCombatUpdate={onCombatUpdate}
              onCombatEnd={onCombatEnd}
            />
          </div>
        )}

        {/* Choice Cards — only on the latest chapter */}
        {showChoices && (
          <div className="mt-16 md:mt-24 animate-fade-in">
            <ChoiceCards
              choices={choices}
              isGenerating={isGenerating}
              playthroughId={playthroughId}
              onChoiceSelect={onChoiceSelect}
            />
          </div>
        )}

        <div ref={bottomRef} className="h-24 lg:h-16" />
      </article>
    </div>
  );
}
