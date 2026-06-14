import { Suspense, lazy, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChapterGeneration } from '../hooks/useChapterGeneration';
import { useSSE } from '../hooks/useSSE';
import { Spinner } from '../design-system/Spinner';
import * as storyApi from '../services/storyApi';
import * as playthroughApi from '../services/playthroughApi';
import { useStoryStore } from '../stores/storyStore';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { Swords, Gamepad2, Compass } from 'lucide-react';
import type { CombatEncounter, Relationship, ConsequenceSeed } from '../services/playthroughApi';
import ChapterNav from '../components/ChapterNav';
import { showSuccess, showError } from '../lib/toast';
import { ConsequenceFlashback } from '../components/ConsequenceFlashback';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { LevelUpModal } from '../components/progression/LevelUpModal';
import { useProgression } from '../hooks/useProgression';
import type { Chapter, Choice } from '../types';

// Heavy subcomponents — lazy-loaded to keep initial StoryReaderPage chunk small.
const EntityDetailModal = lazy(() =>
  import('../components/EntityDetailModal').then((m) => ({ default: m.EntityDetailModal })),
);
type EntityData = (typeof import('../components/EntityDetailModal'))['EntityData'];
const GamePanel = lazy(() => import('../components/game/GamePanel'));
const RelationshipWebModal = lazy(() =>
  import('../components/RelationshipWebModal').then((m) => ({ default: m.RelationshipWebModal })),
);
import { type EntityRef } from '../components/StoryContent';
import { 
  ProtagonistGuard, 
  ReaderHeader, 
  ReaderContent, 
  ReaderMobileNav 
} from '../components/story-reader';

interface ImageCompletedEvent {
  entityType?: string;
  entityId?: string;
  imageUrl?: string;
}

interface ChapterCompletedEvent {
  chapterIndex?: number;
  chapterId?: string;
}

interface CombatResolvedEvent {
  result?: string;
  combatEnded?: boolean;
}

interface EntityUpdatedEvent {
  entityType?: string;
  entityId?: string;
  name?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toImageCompletedEvent(value: unknown): ImageCompletedEvent {
  return isRecord(value) ? {
    entityType: typeof value.entityType === 'string' ? value.entityType : undefined,
    entityId: typeof value.entityId === 'string' ? value.entityId : undefined,
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : undefined,
  } : {};
}

function toChapterCompletedEvent(value: unknown): ChapterCompletedEvent {
  return isRecord(value) ? {
    chapterIndex: typeof value.chapterIndex === 'number' ? value.chapterIndex : undefined,
    chapterId: typeof value.chapterId === 'string' ? value.chapterId : undefined,
  } : {};
}

function toCombatResolvedEvent(value: unknown): CombatResolvedEvent {
  return isRecord(value) ? {
    result: typeof value.result === 'string' ? value.result : undefined,
    combatEnded: typeof value.combatEnded === 'boolean' ? value.combatEnded : undefined,
  } : {};
}

function toEntityUpdatedEvent(value: unknown): EntityUpdatedEvent {
  return isRecord(value) ? {
    entityType: typeof value.entityType === 'string' ? value.entityType : undefined,
    entityId: typeof value.entityId === 'string' ? value.entityId : undefined,
    name: typeof value.name === 'string' ? value.name : undefined,
  } : {};
}

export default function StoryReaderPage() {
  const t = useTranslation();
  const { worldId, playthroughId } = useParams<{ worldId: string; playthroughId: string }>();
  const navigate = useNavigate();
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isNewGame, setIsNewGame] = useState(false);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(-1); // -1 = latest
  const [rpgTab, setRpgTab] = useState<'stats' | 'inventory' | 'abilities' | 'relations'>('stats');
  const [rpgOpen, setRpgOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [detailEntity, setDetailEntity] = useState<EntityData | null>(null);
  const [contextTokens, setContextTokens] = useState<number | null>(null);
  const [isSummarizingArc, setIsSummarizingArc] = useState(false);
  const [activeCombat, setActiveCombat] = useState<CombatEncounter | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [consequences, setConsequences] = useState<ConsequenceSeed[]>([]);
  const [flashbackQueue, setFlashbackQueue] = useState<ConsequenceSeed[]>([]);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [gamePanelOpen, setGamePanelOpen] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<{ show: boolean; newLevel: number; levelTitle?: string; xpToNext: number }>({
    show: false,
    newLevel: 0,
    xpToNext: 0,
  });
  
  const { isGenerating, isRetryingTools, isStreaming, streamingText, streamPhase, error, generateChapterStream, retryChapter, retryTools, clearError } = useChapterGeneration();
  
  const characters = useStoryStore(s => s.characters);
  const items = useStoryStore(s => s.items);
  const specialItems = useStoryStore(s => s.specialItems);
  const fetchCharacters = useStoryStore(s => s.fetchCharacters);
  const fetchItems = useStoryStore(s => s.fetchItems);
  const fetchSpecialItems = useStoryStore(s => s.fetchSpecialItems);
  const fetchPlaythrough = useStoryStore(s => s.fetchPlaythrough);
  const playthrough = useStoryStore(s => s.currentPlaythrough);
  const invalidateCharacters = useStoryStore(s => s.invalidateCharacters);
  const invalidateItems = useStoryStore(s => s.invalidateItems);
  const invalidateSpecialItems = useStoryStore(s => s.invalidateSpecialItems);
  const token = useAuthStore(s => s.token ?? undefined);
  const { progress, refetch: refetchProgress } = useProgression();
  
  const protagonist = characters.find(c => c.role === 'protagonist') || null;
  const npcs = characters.filter(c => c.role === 'npc');
  const sortedNpcs = [...npcs].sort((a, b) => ((a.status || 'active') === 'active' ? 0 : 1) - ((b.status || 'active') === 'active' ? 0 : 1));
  const sortedItems = [...items].sort((a, b) => ((a.status || 'active') === 'active' ? 0 : 1) - ((b.status || 'active') === 'active' ? 0 : 1));
  const sortedSpecialItems = [...specialItems].sort((a, b) => ((a.status || 'active') === 'active' ? 0 : 1) - ((b.status || 'active') === 'active' ? 0 : 1));

  const tabLabels = {
    stats: t.storyReader.statsTab,
    inventory: t.storyReader.inventoryTab,
    abilities: t.storyReader.abilitiesTab,
    relations: t.storyReader.relationshipsTab,
  };
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const totalChapters = chapters.length;
  const isOnLatest = currentChapterIdx === -1 || currentChapterIdx >= totalChapters - 1;
  const activeChapter = isOnLatest ? chapters[totalChapters - 1] : chapters[currentChapterIdx];
  const latestChapter = chapters.length > 0 ? chapters[totalChapters - 1] : null;
  const isLatestFailed = latestChapter?.status === 'failed';
  const isLatestToolsFailed = latestChapter?.status === 'completed' && latestChapter?.toolsStatus === 'failed';
  const isToolsRunning = latestChapter?.toolsStatus === 'running' || latestChapter?.toolsStatus === 'pending';
  const showChoices = isOnLatest && !isGenerating && !isLatestFailed && !isLatestToolsFailed && choices.length > 0;

  const goToChapter = useCallback((idx: number) => {
    if (idx >= 0 && idx < totalChapters) {
      setCurrentChapterIdx(idx);
    }
  }, [totalChapters]);

  const goToLatest = useCallback(() => {
    setCurrentChapterIdx(-1);
  }, []);

  useEffect(() => {
    if (isGenerating) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isGenerating]);

  useEffect(() => {
    if (playthroughId) {
      loadStoryState();
      fetchPlaythrough(playthroughId).catch(console.error);
      fetchCharacters(playthroughId).catch(console.error);
      fetchItems(playthroughId).catch(console.error);
      fetchSpecialItems(playthroughId).catch(console.error);
      loadRelationships();
      loadActiveCombat();
      loadConsequences();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playthroughId]);

  useEffect(() => {
    if (!isGenerating || !playthroughId) return;

    const pollInterval = setInterval(async () => {
      if (!isGeneratingRef.current) return;

      try {
        const state = await storyApi.getStoryState(playthroughId);
        if (!isGeneratingRef.current) return;

        const stateChapters: Chapter[] = state.chapters || (state.latestChapter ? [state.latestChapter] : []);
        if (stateChapters.length > 0) {
          const latest = stateChapters[stateChapters.length - 1];
          if (latest?.content) {
            setChapters(stateChapters);
            setChoices(state.choices || []);
          }
        }
      } catch { /* polling error is non-critical */ }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isGenerating, playthroughId]);

  const loadStoryState = async () => {
    try {
      setIsLoadingState(true);
      const state = await storyApi.getStoryState(playthroughId!);
      
      if (state.chapters && state.chapters.length > 0) {
        setChapters(state.chapters);
        const latest = state.chapters[state.chapters.length - 1];
        if (latest.metadata?.contextTokens) {
          setContextTokens(latest.metadata.contextTokens);
        }
      } else if (state.latestChapter) {
        setChapters([state.latestChapter]);
        if (state.latestChapter.metadata?.contextTokens) {
          setContextTokens(state.latestChapter.metadata.contextTokens);
        }
      } else {
        setChapters([]);
      }
      
      setChoices(state.choices || []);
      setIsNewGame(state.isNewGame || false);
    } catch (error) {
      console.error('Failed to load story state:', error);
    } finally {
      setIsLoadingState(false);
    }
  };

  const reloadAfterGeneration = async () => {
    if (!playthroughId) return;
    await Promise.all([
      loadStoryState(),
      fetchCharacters(playthroughId),
      fetchItems(playthroughId),
      fetchSpecialItems(playthroughId),
      loadRelationships(),
      loadActiveCombat(),
      loadConsequences(true),
      refetchProgress(),
    ]);
    setCurrentChapterIdx(-1);
  };

  useEffect(() => {
    if (progress && prevLevel !== null && progress.level > prevLevel) {
      setLevelUpModal({
        show: true,
        newLevel: progress.level,
        levelTitle: progress.levelTitle,
        xpToNext: progress.xpToNextLevel,
      });
    }
    if (progress) {
      setPrevLevel(progress.level);
    }
  }, [progress, prevLevel]);

  const loadRelationships = async () => {
    if (!playthroughId) return;
    try {
      const rels = await playthroughApi.listRelationships(playthroughId);
      setRelationships(rels);
    } catch { /* non-critical */ }
  };

  const loadConsequences = async (isReload = false) => {
    if (!playthroughId) return;
    try {
      const freshConsequences = await playthroughApi.listConsequences(playthroughId);
      
      if (isReload && consequences.length > 0) {
        const newlyActivated = freshConsequences.filter(fresh => 
          fresh.activated && !consequences.find(old => old._id === fresh._id && old.activated)
        );
        if (newlyActivated.length > 0) {
          setFlashbackQueue(newlyActivated);
        }
      }
      setConsequences(freshConsequences);
    } catch { /* non-critical */ }
  };

  const loadActiveCombat = async () => {
    if (!playthroughId) return;
    try {
      const combat = await playthroughApi.getActiveCombat(playthroughId);
      setActiveCombat(combat);
    } catch { /* non-critical */ }
  };

  useSSE(playthroughId, token, {
    onImageCompleted: async (payload) => {
      const event = toImageCompletedEvent(payload);
      const entity = event.entityType ?? 'Entity';
      showSuccess(
        t.storyReader.toast.imageReady,
        t.storyReader.toast.imageReadyDesc.replace('{entity}', entity),
      );
      await Promise.all([invalidateCharacters(), invalidateItems(), invalidateSpecialItems()]);
    },
    onChapterCompleted: async (payload) => {
      const event = toChapterCompletedEvent(payload);
      const index = typeof event.chapterIndex === 'number' ? String(event.chapterIndex + 1) : '?';
      showSuccess(
        t.storyReader.toast.chapterCompleted.replace('{index}', index),
        t.storyReader.toast.chapterCompletedDesc,
      );
      await reloadAfterGeneration();
    },
    onCombatResolved: async (payload) => {
      const event = toCombatResolvedEvent(payload);
      const result = event.result ? event.result.replace(/_/g, ' ') : 'resolved';
      showSuccess(
        t.storyReader.toast.combatResolved,
        t.storyReader.toast.combatResolvedDesc.replace('{result}', result),
      );
      await Promise.all([loadActiveCombat(), invalidateCharacters(), loadStoryState()]);
    },
    onEntityUpdated: async (payload) => {
      const event = toEntityUpdatedEvent(payload);
      const name = event.name ?? event.entityType ?? 'Entity';
      showSuccess(
        t.storyReader.toast.entityUpdated,
        t.storyReader.toast.entityUpdatedDesc.replace('{name}', name),
      );
      await Promise.all([invalidateCharacters(), invalidateItems(), invalidateSpecialItems()]);
    },
  });

  const handleChoiceSelect = async (choiceText: string) => {
    if (!playthroughId) return;
    clearError();
    setChoices([]);
    setIsNewGame(false);
    setCurrentChapterIdx(-1);
    // Save the freeform choice to the draft store so the user can resume
    // it after a refresh. Cleared on successful generation.
    if (choiceText && choiceText !== t.storyReader.beginStoryPrompt) {
      try {
        const { useDraftStore } = await import('../stores/draftStore');
        useDraftStore.getState().setChoice(playthroughId, choiceText);
      } catch {
        /* non-critical */
      }
    }
    await generateChapterStream(playthroughId, choiceText);
    // Clear the saved choice once generation starts.
    try {
      const { useDraftStore } = await import('../stores/draftStore');
      useDraftStore.getState().clearChoice(playthroughId);
    } catch {
      /* non-critical */
    }
    await reloadAfterGeneration();
  };

  const handleBeginStory = async () => {
    if (!playthroughId) return;
    clearError();
    setIsNewGame(false);
    setChoices([]);
    setCurrentChapterIdx(-1);
    await generateChapterStream(playthroughId, t.storyReader.beginStoryPrompt);
    await reloadAfterGeneration();
  };

  const handleRetry = async () => {
    if (!latestChapter || !playthroughId) return;
    clearError();
    await retryChapter(latestChapter._id);
    await reloadAfterGeneration();
  };

  const handleRetryTools = async () => {
    if (!latestChapter || !playthroughId) return;
    clearError();
    await retryTools(latestChapter._id);
    await reloadAfterGeneration();
  };

  const handleSummarizeArc = async () => {
    if (!playthroughId || isSummarizingArc) return;
    if (!confirm(t.storyReader.confirmSummarize)) return;
    setIsSummarizingArc(true);
    try {
      await storyApi.summarizeArc(playthroughId);
      showSuccess(t.toast.arcSummarized);
      await loadStoryState();
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || undefined
        : err instanceof Error ? err.message : undefined;
      showError(t.toast.arcSummarizeFailed, message);
    } finally {
      setIsSummarizingArc(false);
    }
  };

  const handleEntityClick = useCallback((entity: EntityRef) => {
    if (entity.type === 'char') {
      const char = characters.find(c => c.name === entity.name);
      if (char) setDetailEntity({ type: 'character', data: char });
    } else if (entity.type === 'item') {
      const item = items.find(i => i.name === entity.name);
      if (item) setDetailEntity({ type: 'item', data: item });
    } else if (entity.type === 'special') {
      const si = specialItems.find(s => s.name === entity.name);
      if (si) setDetailEntity({ type: 'special', data: si });
    }
  }, [characters, items, specialItems]);

  if (isLoadingState && chapters.length === 0) {
    return <div className="max-w-7xl mx-auto p-8"><LoadingSkeleton variant="story" /></div>;
  }

  if (!isLoadingState && !protagonist) {
    const resolvedWorldId = worldId || (playthrough?.worldId && (typeof playthrough.worldId === 'object' ? (playthrough.worldId as { _id: string })._id : playthrough.worldId)) || '';
    return (
      <ProtagonistGuard 
        worldId={resolvedWorldId} 
        playthroughId={playthroughId!} 
        onNavigate={navigate} 
      />
    );
  }

  return (
    <div className="flex bg-ink-950 min-h-[calc(100vh-4rem)] relative">
      {/* Desktop Left sidebar — Chapter Navigation */}
      <div className="hidden lg:flex flex-col w-64 border-r border-ink-700 bg-ink-900/50 p-5 shrink-0">
        <h3 className="font-display text-sm text-ink-100 mb-4 border-b border-ink-700 pb-3 uppercase tracking-wider">{t.storyReader.storyNavigation}</h3>
        
        {/* Detailed World Map Button */}
        <button
          onClick={() => navigate(`/playthroughs/${playthroughId}/map`)}
          className="mb-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent-600/10 hover:bg-accent-600/20 border border-accent-600/30 text-accent-400 hover:text-accent-300 font-semibold text-sm transition-all duration-200 shadow-md shadow-accent-600/5 cursor-pointer shrink-0"
        >
          <Compass size={16} />
          {t.map?.title || 'Xem Bản Đồ'}
        </button>

        <ChapterNav
          chapters={chapters}
          goToChapter={goToChapter}
          isOnLatest={isOnLatest}
          currentChapterIdx={currentChapterIdx}
          totalChapters={totalChapters}
          contextTokens={contextTokens}
          handleSummarizeArc={handleSummarizeArc}
          isSummarizingArc={isSummarizingArc}
          isGenerating={isGenerating}
          t={t}
          activeChapter={activeChapter}
          isLatestFailed={isLatestFailed}
          isLatestToolsFailed={isLatestToolsFailed}
          isNewGame={isNewGame}
          handleBeginStory={handleBeginStory}
        />
      </div>

      {/* Center: Reading column */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChapter && !isNewGame && (
          <div className="max-w-[65ch] mx-auto w-full px-4 pt-8">
            <ReaderHeader
              currentChapterIdx={currentChapterIdx}
              totalChapters={totalChapters}
              isOnLatest={isOnLatest}
              onGoToChapter={goToChapter}
              onGoToLatest={goToLatest}
            />
          </div>
        )}
        
        <ReaderContent
          isNewGame={isNewGame}
          chapters={chapters}
          activeChapter={activeChapter ?? null}
          latestChapter={latestChapter ?? null}
          isGenerating={isGenerating}
          isStreaming={isStreaming}
          streamingText={streamingText}
          streamPhase={streamPhase}
          isOnLatest={isOnLatest}
          isLatestFailed={isLatestFailed}
          isLatestToolsFailed={isLatestToolsFailed}
          isToolsRunning={isToolsRunning}
          isRetryingTools={isRetryingTools}
          error={error}
          choices={choices}
          playthroughId={playthroughId!}
          activeCombat={activeCombat}
          showChoices={showChoices}
          onBeginStory={handleBeginStory}
          onEntityClick={handleEntityClick}
          onRetry={handleRetry}
          onRetryTools={handleRetryTools}
          onChoiceSelect={handleChoiceSelect}
          onCombatUpdate={(updated) => setActiveCombat(updated)}
          onCombatEnd={() => { loadActiveCombat(); reloadAfterGeneration(); }}
          bottomRef={bottomRef}
        />
      </div>

      {/* Desktop Right sidebar — RPG Panel */}
      <div className="hidden xl:flex flex-col w-72 border-l border-ink-700 bg-ink-900/40 p-5 shrink-0 max-h-[calc(100vh-4rem)]">
        <h3 className="font-display text-sm text-ink-100 mb-4 border-b border-ink-700 pb-3 uppercase tracking-wider shrink-0">{t.storyReader.rpgPanel}</h3>
        <RPGPanel
          rpgTab={rpgTab}
          setRpgTab={setRpgTab}
          tabLabels={tabLabels}
          protagonist={protagonist}
          sortedNpcs={sortedNpcs}
          sortedItems={sortedItems}
          sortedSpecialItems={sortedSpecialItems}
          characters={characters}
          relationships={relationships}
          setDetailEntity={setDetailEntity}
          setIsRelationshipModalOpen={setIsRelationshipModalOpen}
          isRelationshipModalOpen={isRelationshipModalOpen}
          t={t}
        />
      </div>

      {/* Floating RPG toggle — Tablet view */}
      <button
        onClick={() => { setRpgOpen(v => !v); setNavOpen(false); }}
        className="hidden lg:block xl:hidden fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-ink-800 border border-ink-700 rounded-l-xl p-3 hover:border-accent-400/50 transition-all duration-200 shadow-lg"
        title={t.storyReader.rpgPanel}
      >
        <Swords size={18} className="text-ink-100" />
      </button>

      {/* Mobile navigation and drawers */}
      <ReaderMobileNav
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rpgOpen={rpgOpen}
        setRpgOpen={setRpgOpen}
        chapters={chapters}
        goToChapter={goToChapter}
        isOnLatest={isOnLatest}
        currentChapterIdx={currentChapterIdx}
        totalChapters={totalChapters}
        contextTokens={contextTokens}
        handleSummarizeArc={handleSummarizeArc}
        isSummarizingArc={isSummarizingArc}
        isGenerating={isGenerating}
        activeChapter={activeChapter}
        isLatestFailed={isLatestFailed}
        isLatestToolsFailed={isLatestToolsFailed}
        isNewGame={isNewGame}
        handleBeginStory={handleBeginStory}
        navigateBack={() => navigate(-1)}
        rpgTab={rpgTab}
        setRpgTab={setRpgTab}
        tabLabels={tabLabels}
        protagonist={protagonist}
        sortedNpcs={sortedNpcs}
        sortedItems={sortedItems}
        sortedSpecialItems={sortedSpecialItems}
        characters={characters}
        relationships={relationships}
        setDetailEntity={setDetailEntity}
        setIsRelationshipModalOpen={setIsRelationshipModalOpen}
        isRelationshipModalOpen={isRelationshipModalOpen}
      />

      {/* Global Modals and Buttons */}
      {/* Floating Map Button */}
      <button
        onClick={() => navigate(`/playthroughs/${playthroughId}/map`)}
        className="fixed bottom-36 lg:bottom-22 right-4 z-30 bg-ink-800 border border-ink-700 hover:border-accent-400/50 text-accent-400 hover:text-accent-300 rounded-full p-3.5 shadow-lg hover:shadow-accent-600/10 transition-all duration-200 flex items-center justify-center cursor-pointer"
        title={t.map?.title || 'Xem Bản Đồ'}
      >
        <Compass size={22} />
      </button>

      <button
        onClick={() => setGamePanelOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-4 z-30 bg-accent-600 hover:bg-accent-500 text-white rounded-full p-3.5 shadow-lg hover:shadow-accent-600/30 transition-all duration-200"
        title={t.playthrough.gameMenu}
      >
        <Gamepad2 size={22} />
      </button>

      <Suspense fallback={<div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/60"><Spinner size="lg" /></div>}>
        <GamePanel
          isOpen={gamePanelOpen}
          onClose={() => setGamePanelOpen(false)}
          playthroughId={playthroughId!}
          protagonist={protagonist}
          sortedNpcs={sortedNpcs}
          sortedItems={sortedItems}
          sortedSpecialItems={sortedSpecialItems}
          characters={characters}
          relationships={relationships}
          setDetailEntity={setDetailEntity}
          setIsRelationshipModalOpen={setIsRelationshipModalOpen}
          t={t}
        />

        <EntityDetailModal entity={detailEntity} onClose={() => setDetailEntity(null)} />

        <RelationshipWebModal
          isOpen={isRelationshipModalOpen}
          onClose={() => setIsRelationshipModalOpen(false)}
          relationships={relationships}
          characters={characters}
        />
      </Suspense>

      <ConsequenceFlashback consequences={flashbackQueue} />
      
      <LevelUpModal
        isOpen={levelUpModal.show}
        newLevel={levelUpModal.newLevel}
        levelTitle={levelUpModal.levelTitle}
        xpRequiredForNext={levelUpModal.xpToNext}
        onClose={() => setLevelUpModal(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
