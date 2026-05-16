import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChapterGeneration } from '../hooks/useChapterGeneration';
import { useSSE } from '../hooks/useSSE';
import { StoryContent, type EntityRef } from '../components/StoryContent';
import { EntityDetailModal, type EntityData } from '../components/EntityDetailModal';
import { ChoiceCards } from '../components/ChoiceCards';
import { CombatPanel } from '../components/CombatPanel';
import * as storyApi from '../services/storyApi';
import * as playthroughApi from '../services/playthroughApi';
import { useStoryStore } from '../stores/storyStore';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';
import { Swords, X, BookOpen, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, List, Gamepad2, UserRound } from 'lucide-react';
import GamePanel from '../components/game/GamePanel';
import type { CombatEncounter, Relationship, ConsequenceSeed } from '../services/playthroughApi';
import RPGPanel from '../components/RPGPanel';
import ChapterNav from '../components/ChapterNav';
import { showSuccess, showError } from '../lib/toast';
import { RelationshipWebModal } from '../components/RelationshipWebModal';
import { ConsequenceFlashback } from '../components/ConsequenceFlashback';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { LevelUpModal } from '../components/progression/LevelUpModal';
import { useProgression } from '../hooks/useProgression';

// Matches backend Chapter model
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

// Matches backend ChoiceSchema (_id: false)
interface Choice {
  text: string;
  type: 'continue' | 'new_arc' | 'custom';
}

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
  
  // Individual selectors to avoid getSnapshot infinite loop
  const characters = useStoryStore(s => s.characters);
  const items = useStoryStore(s => s.items);
  const specialItems = useStoryStore(s => s.specialItems);
  const fetchCharacters = useStoryStore(s => s.fetchCharacters);
  const fetchItems = useStoryStore(s => s.fetchItems);
  const fetchSpecialItems = useStoryStore(s => s.fetchSpecialItems);
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

  // Keep ref in sync so polling callbacks can check current value
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  // Chapter navigation
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

  // Auto-scroll when generating
  useEffect(() => {
    if (isGenerating) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isGenerating]);

  // Initial load
  useEffect(() => {
    if (playthroughId) {
      loadStoryState();
      fetchCharacters(playthroughId).catch(console.error);
      fetchItems(playthroughId).catch(console.error);
      fetchSpecialItems(playthroughId).catch(console.error);
      loadRelationships();
      loadActiveCombat();
      loadConsequences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playthroughId]);

  // Poll for chapter updates during generation
  // Detects Pass 1 completion from DB while the API call is still blocking on Pass 2
  useEffect(() => {
    if (!isGenerating || !playthroughId) return;

    const pollInterval = setInterval(async () => {
      // Guard: don't fire if generation already finished (prevents stale overwrites)
      if (!isGeneratingRef.current) return;

      try {
        const state = await storyApi.getStoryState(playthroughId);

        // Guard after async: generation may have ended while request was in-flight
        if (!isGeneratingRef.current) return;

        const stateChapters: Chapter[] = state.chapters || (state.latestChapter ? [state.latestChapter] : []);

        if (stateChapters.length > 0) {
          const latest = stateChapters[stateChapters.length - 1];
          // If the latest chapter now has content (Pass 1 done), update UI so user can start reading
          if (latest?.content) {
            setChapters(stateChapters);
            setChoices(state.choices || []);
          }
        }
      } catch {
        // Polling failure is non-critical — silently ignore
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isGenerating, playthroughId]);

  const loadStoryState = async () => {
    try {
      setIsLoadingState(true);
      const state = await storyApi.getStoryState(playthroughId!);
      
      if (state.chapters && state.chapters.length > 0) {
        setChapters(state.chapters);
        // Extract contextTokens from the latest chapter's metadata
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

  // Check for level-up after each generation
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
      showSuccess('Image ready', `${event.entityType ?? 'Entity'} image has been generated.`);

      await Promise.all([
        invalidateCharacters(),
        invalidateItems(),
        invalidateSpecialItems(),
      ]);
    },
    onChapterCompleted: async (payload) => {
      const event = toChapterCompletedEvent(payload);
      const chapterLabel = typeof event.chapterIndex === 'number'
        ? `Chapter ${event.chapterIndex + 1} completed`
        : 'Chapter completed';

      showSuccess(chapterLabel, 'Story data refreshed.');
      await reloadAfterGeneration();
    },
    onCombatResolved: async (payload) => {
      const event = toCombatResolvedEvent(payload);
      const result = event.result ? event.result.replace(/_/g, ' ') : 'resolved';

      showSuccess('Combat resolved', `Result: ${result}`);
      await Promise.all([
        loadActiveCombat(),
        invalidateCharacters(),
        loadStoryState(),
      ]);
    },
    onEntityUpdated: async (payload) => {
      const event = toEntityUpdatedEvent(payload);
      const name = event.name ?? event.entityType ?? 'Entity';

      showSuccess('Entity updated', `${name} changed.`);
      await Promise.all([
        invalidateCharacters(),
        invalidateItems(),
        invalidateSpecialItems(),
      ]);
    },
  });

  const handleChoiceSelect = async (choiceText: string) => {
    if (!playthroughId) return;
    clearError();
    setChoices([]);
    setIsNewGame(false);
    setCurrentChapterIdx(-1);

    await generateChapterStream(playthroughId, choiceText);
    await reloadAfterGeneration();
  };

  const handleBeginStory = async () => {
    if (!playthroughId) return;
    clearError();
    setIsNewGame(false);
    setChoices([]);
    setCurrentChapterIdx(-1);

    await generateChapterStream(playthroughId, 'Begin the story');
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

  // Handle entity clicks from story content or sidebar
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
    return (
      <div className="max-w-7xl mx-auto p-8">
        <LoadingSkeleton variant="story" />
      </div>
    );
  }

  // Protagonist guard — must create protagonist before playing
  if (!isLoadingState && !protagonist) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-ink-950">
        <div className="text-center max-w-md px-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-accent-600/10 border border-accent-600/20 flex items-center justify-center mx-auto mb-6">
            <UserRound size={36} className="text-accent-400" />
          </div>
          <h2 className="font-display text-2xl text-ink-100 mb-3">{t.playthrough.createProtagonist}</h2>
          <p className="text-ink-200/60 text-sm mb-8">{t.playthrough.createProtagonistRequired}</p>
          <button
            onClick={() => navigate(`/worlds/${worldId}/playthroughs/${playthroughId}/characters/new?role=protagonist`)}
            className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-8 py-3.5 rounded-2xl font-display text-base transition-all duration-200 shadow-lg hover:shadow-accent-600/30"
          >
            {t.playthrough.createProtagonist}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-ink-950 min-h-[calc(100vh-4rem)] relative">
      {/* Left sidebar — Chapter Navigation */}
      <div className="hidden lg:flex flex-col w-64 border-r border-ink-700 bg-ink-900/50 p-5 shrink-0">
        <h3 className="font-display text-sm text-ink-100 mb-4 border-b border-ink-700 pb-3 uppercase tracking-wider">{t.storyReader.storyNavigation}</h3>
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
                onClick={handleBeginStory}
                className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-8 py-3.5 rounded-2xl font-display text-base transition-all duration-200 shadow-lg hover:shadow-accent-600/30"
              >
                {t.storyReader.beginStory}
              </button>
            </div>
          )}

          {/* Chapter header + navigation */}
          {activeChapter && !isNewGame && (
            <div className="flex items-center justify-between mb-8 font-sans">
              <button
                onClick={() => goToChapter((isOnLatest ? totalChapters - 1 : currentChapterIdx) - 1)}
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
                  if (next >= totalChapters - 1) goToLatest();
                  else goToChapter(next);
                }}
                disabled={isOnLatest}
                className="p-2 rounded-xl text-ink-200/60 hover:text-ink-100 hover:bg-ink-800/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={t.storyReader.nextChapter}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          
          {/* Current chapter content (with entity highlighting) */}
          {activeChapter && activeChapter.content && activeChapter.status !== 'failed' && (
            <div className="text-ink-200/90 animate-fade-in">
              <StoryContent
                text={activeChapter.content}
                onEntityClick={handleEntityClick}
              />
            </div>
          )}

          {/* Generating state — streaming text or loading */}
          {isGenerating && (!latestChapter || !latestChapter.content) && (
            <div className="border-l-2 border-accent-400/30 pl-5 py-6 mt-4 bg-accent-400/[0.03] rounded-r-2xl animate-fade-in">
              {isStreaming && streamingText ? (
                <div className="text-ink-200/90">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="animate-spin w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs font-sans text-accent-400 font-medium">
                      {streamPhase === 'tools' ? t.storyReader.streamPhaseTools : t.storyReader.streamingChapter}
                    </span>
                  </div>
                  <StoryContent text={streamingText} onEntityClick={handleEntityClick} />
                  <span className="inline-block w-0.5 h-4 bg-accent-400 animate-pulse ml-0.5 align-middle" />
                </div>
              ) : (
                <div className="flex items-center gap-3 text-ink-200/60">
                  <svg className="animate-spin w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div>
                    <p className="text-sm font-sans font-medium text-ink-100">
                      {streamPhase === 'context' ? 'Analyzing world and story state...' : t.storyReader.generatingChapter}
                    </p>
                    <p className="text-xs font-sans text-ink-200/50 mt-0.5">{t.storyReader.generatingHint}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generating NEXT chapter — streaming or waiting */}
          {isGenerating && isOnLatest && latestChapter?.content && !isToolsRunning && (
            <div className="border-l-2 border-accent-400/30 pl-5 py-6 mt-8 bg-accent-400/[0.03] rounded-r-2xl animate-fade-in">
              {isStreaming && streamingText ? (
                <div className="text-ink-200/90">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="animate-spin w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs font-sans text-accent-400 font-medium">
                      {streamPhase === 'tools' ? t.storyReader.streamPhaseTools : t.storyReader.streamingChapter}
                    </span>
                  </div>
                  <StoryContent text={streamingText} onEntityClick={handleEntityClick} />
                  <span className="inline-block w-0.5 h-4 bg-accent-400 animate-pulse ml-0.5 align-middle" />
                </div>
              ) : (
                <div className="flex items-center gap-3 text-ink-200/60">
                  <svg className="animate-spin w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div>
                    <p className="text-sm font-sans font-medium text-ink-100">
                      {streamPhase === 'context' ? 'Analyzing world and story state...' : t.storyReader.generatingChapter}
                    </p>
                    <p className="text-xs font-sans text-ink-200/50 mt-0.5">{t.storyReader.generatingHint}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Failed chapter — error + retry */}
          {isOnLatest && isLatestFailed && !isGenerating && (
            <div className="border-l-2 border-red-400/30 pl-5 py-6 mt-4 bg-red-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-sans font-medium text-red-300">{t.storyReader.generationFailed}</p>
                  <p className="text-xs font-sans text-ink-200/50 mt-1">{error || t.storyReader.generationFailedHint}</p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-red-500/20 hover:border-red-500/30"
                  >
                    <RefreshCw size={14} />
                    {t.storyReader.retryGeneration}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pass 2 — Updating game state indicator */}
          {isOnLatest && activeChapter && activeChapter.content && isToolsRunning && !isRetryingTools && (
            <div className="border-l-2 border-blue-400/30 pl-5 py-4 mt-4 bg-blue-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="flex items-center gap-3 text-ink-200/60">
                <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-sans font-medium text-blue-300">{t.storyReader.updatingGameState}</p>
              </div>
            </div>
          )}

          {/* Tools failed — content OK but game state update failed */}
          {isOnLatest && isLatestToolsFailed && !isGenerating && !isRetryingTools && (
            <div className="border-l-2 border-amber-400/30 pl-5 py-5 mt-4 bg-amber-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-sans font-medium text-amber-300">{t.storyReader.toolsFailedTitle}</p>
                  <p className="text-xs font-sans text-ink-200/50 mt-1">{t.storyReader.toolsFailedHint}</p>
                  <button
                    onClick={handleRetryTools}
                    className="inline-flex items-center gap-2 mt-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-colors border border-amber-500/20 hover:border-amber-500/30"
                  >
                    <RefreshCw size={14} />
                    {t.storyReader.retryTools}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Retrying tools indicator */}
          {isRetryingTools && (
            <div className="border-l-2 border-blue-400/30 pl-5 py-4 mt-4 bg-blue-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-sans font-medium text-blue-300">{t.storyReader.retryingTools}</p>
              </div>
            </div>
          )}
          {/* Generation error (non-failed-chapter errors, e.g. network) */}
          {error && !isLatestFailed && !isGenerating && (
            <div className="border-l-2 border-amber-400/30 pl-5 py-4 mt-4 bg-amber-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle size={16} />
                <p className="text-sm font-sans">{error}</p>
              </div>
            </div>
          )}

          {/* Combat Panel — active combat encounter */}
          {activeCombat && activeCombat.status === 'active' && isOnLatest && !isGenerating && (
            <div className="mt-8 animate-fade-in">
              <CombatPanel
                combat={activeCombat}
                onCombatUpdate={(updated) => setActiveCombat(updated)}
                onCombatEnd={() => {
                  loadActiveCombat();
                  reloadAfterGeneration();
                }}
              />
            </div>
          )}

          {/* Choice Cards — only on the latest chapter */}
          {showChoices && (
            <div className="mt-16 md:mt-24 animate-fade-in">
              <ChoiceCards
                choices={choices}
                isGenerating={isGenerating}
                playthroughId={playthroughId!}
                onChoiceSelect={handleChoiceSelect}
              />
            </div>
          )}

          <div ref={bottomRef} className="h-24 lg:h-16" />
        </article>
      </div>

      {/* Right sidebar — RPG Panel (desktop) */}
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

      {/* Floating RPG toggle — visible lg to xl only (mobile uses bottom bar) */}
      <button
        onClick={() => { setRpgOpen(v => !v); setNavOpen(false); }}
        className="hidden lg:block xl:hidden fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-ink-800 border border-ink-700 rounded-l-xl p-3 hover:border-accent-400/50 transition-all duration-200 shadow-lg"
        title={t.storyReader.rpgPanel}
      >
        <Swords size={18} className="text-ink-100" />
      </button>

      {/* Mobile RPG drawer */}
      <div className={`xl:hidden fixed right-0 top-0 h-full w-80 bg-ink-900 border-l border-ink-700 z-50 transform transition-transform duration-300 overflow-hidden flex flex-col ${rpgOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-display text-sm text-ink-100 uppercase tracking-wider">{t.storyReader.rpgPanel}</h3>
            <button onClick={() => setRpgOpen(false)} className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>
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
      </div>

      {/* Mobile backdrop */}
      {rpgOpen && (
        <div className="xl:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setRpgOpen(false)} />
      )}


      {/* Mobile chapter navigation drawer (left side) */}
      <div className={`lg:hidden fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-ink-900 border-r border-ink-700 z-50 transform transition-transform duration-300 overflow-hidden flex flex-col ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-display text-sm text-ink-100 uppercase tracking-wider">{t.storyReader.storyNavigation}</h3>
            <button onClick={() => setNavOpen(false)} className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>

          <ChapterNav
            chapters={chapters}
            goToChapter={(idx) => { goToChapter(idx); setNavOpen(false); }}
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
      </div>

      {/* Mobile chapter drawer backdrop */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setNavOpen(false)} />
      )}

      {/* Mobile bottom navigation bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-ink-900/95 backdrop-blur-md border-t border-ink-700 safe-area-bottom">
        <div className="flex items-stretch h-14">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-ink-200/60 hover:text-ink-100 active:bg-ink-800/50 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-[10px] font-medium">{t.storyReader.mobileBack}</span>
          </button>
          <button
            onClick={() => { setNavOpen(v => !v); setRpgOpen(false); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-ink-800/50 ${navOpen ? 'text-accent-400' : 'text-ink-200/60 hover:text-ink-100'}`}
          >
            <div className="relative">
              <List size={20} />
              {totalChapters > 0 && (
                <span className="absolute -top-1.5 -right-2.5 text-[9px] font-bold bg-accent-600 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">{totalChapters}</span>
              )}
            </div>
            <span className="text-[10px] font-medium">{t.storyReader.mobileChapters}</span>
          </button>
          <button
            onClick={() => { setRpgOpen(v => !v); setNavOpen(false); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-ink-800/50 ${rpgOpen ? 'text-accent-400' : 'text-ink-200/60 hover:text-ink-100'}`}
          >
            <Swords size={20} />
            <span className="text-[10px] font-medium">{t.storyReader.mobileRpg}</span>
          </button>
        </div>
      </div>

      {/* Floating Game Menu button */}
      <button
        onClick={() => setGamePanelOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-4 z-30 bg-accent-600 hover:bg-accent-500 text-white rounded-full p-3.5 shadow-lg hover:shadow-accent-600/30 transition-all duration-200"
        title={t.playthrough.gameMenu}
      >
        <Gamepad2 size={22} />
      </button>

      {/* Game Panel Modal */}
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

      {/* Entity Detail Modal */}
      <EntityDetailModal entity={detailEntity} onClose={() => setDetailEntity(null)} />

      {/* Relationship Web Modal */}
      <RelationshipWebModal
        isOpen={isRelationshipModalOpen}
        onClose={() => setIsRelationshipModalOpen(false)}
        relationships={relationships}
        characters={characters}
      />

      {/* Flashback Banner */}
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
