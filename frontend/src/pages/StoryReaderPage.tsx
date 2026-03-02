import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChapterGeneration } from '../hooks/useChapterGeneration';
import { StoryContent, type EntityRef } from '../components/StoryContent';
import { EntityDetailModal, type EntityData } from '../components/EntityDetailModal';
import { ChoiceCards } from '../components/ChoiceCards';
import * as storyApi from '../services/storyApi';
import { useStoryStore } from '../stores/storyStore';
import { useTranslation } from '../i18n';
import { UserRound, Users, Package, Sparkles, Swords, X, BookOpen, ChevronLeft, ChevronRight, Skull, RefreshCw, AlertTriangle, Scissors, Zap } from 'lucide-react';
import type { ItemRarity } from '../services/playthroughApi';
import { getImageUrl } from '../utils/url';
import { showSuccess, showError } from '../lib/toast';

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

const rarityColor: Record<ItemRarity, string> = {
  common: 'text-ink-200/70',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

export default function StoryReaderPage() {
  const t = useTranslation();
  const { playthroughId } = useParams<{ playthroughId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isNewGame, setIsNewGame] = useState(false);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(-1); // -1 = latest
  const [rpgTab, setRpgTab] = useState<'stats' | 'inventory' | 'abilities'>('stats');
  const [rpgOpen, setRpgOpen] = useState(false);
  const [detailEntity, setDetailEntity] = useState<EntityData | null>(null);
  const [contextTokens, setContextTokens] = useState<number | null>(null);
  const [isSummarizingArc, setIsSummarizingArc] = useState(false);
  
  const { isGenerating, isRetryingTools, error, generateChapter, retryChapter, retryTools, clearError } = useChapterGeneration();
  
  // Individual selectors to avoid getSnapshot infinite loop
  const characters = useStoryStore(s => s.characters);
  const items = useStoryStore(s => s.items);
  const specialItems = useStoryStore(s => s.specialItems);
  const fetchCharacters = useStoryStore(s => s.fetchCharacters);
  const fetchItems = useStoryStore(s => s.fetchItems);
  const fetchSpecialItems = useStoryStore(s => s.fetchSpecialItems);
  
  const protagonist = characters.find(c => c.role === 'protagonist') || null;
  const npcs = characters.filter(c => c.role === 'npc');
  const sortedNpcs = [...npcs].sort((a, b) => ((a.status || 'active') === 'active' ? 0 : 1) - ((b.status || 'active') === 'active' ? 0 : 1));
  const sortedItems = [...items].sort((a, b) => ((a.status || 'active') === 'active' ? 0 : 1) - ((b.status || 'active') === 'active' ? 0 : 1));
  const sortedSpecialItems = [...specialItems].sort((a, b) => ((a.status || 'active') === 'active' ? 0 : 1) - ((b.status || 'active') === 'active' ? 0 : 1));

  const tabLabels = {
    stats: t.storyReader.statsTab,
    inventory: t.storyReader.inventoryTab,
    abilities: t.storyReader.abilitiesTab,
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
    }
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
          if (latest.content) {
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
    ]);
    setCurrentChapterIdx(-1);
  };

  const handleChoiceSelect = async (choiceText: string) => {
    if (!playthroughId || !token) return;
    clearError();
    setChoices([]);
    setIsNewGame(false);
    setCurrentChapterIdx(-1);

    await generateChapter(playthroughId, choiceText);
    await reloadAfterGeneration();
  };

  const handleBeginStory = async () => {
    if (!playthroughId || !token) return;
    clearError();
    setIsNewGame(false);
    setChoices([]);
    setCurrentChapterIdx(-1);

    await generateChapter(playthroughId, 'Begin the story');
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
    } catch (err: any) {
      showError(t.toast.arcSummarizeFailed, err?.response?.data?.error || err?.message);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 mx-auto text-accent-400 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <p className="text-ink-200/60">{t.storyReader.loading}</p>
        </div>
      </div>
    );
  }

  const rpgPanelContent = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tabs */}
      <div className="flex border-b border-ink-700 mb-4 shrink-0">
        {(['stats', 'inventory', 'abilities'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setRpgTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              rpgTab === tab
                ? 'text-accent-400 border-b-2 border-accent-400'
                : 'text-ink-200/50 hover:text-ink-200/80'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {rpgTab === 'stats' && (
        <div className="space-y-5 overflow-y-auto flex-1">
          {protagonist && (
            <div>
              <button onClick={() => setDetailEntity({ type: 'character', data: protagonist })} className="flex items-center gap-3 mb-3 w-full text-left hover:bg-ink-800/50 rounded-xl p-1.5 -m-1.5 transition-colors cursor-pointer">
                {protagonist.imageUrl ? (
                  <img src={getImageUrl(protagonist.imageUrl)} alt={protagonist.name} className="w-12 h-12 rounded-xl object-cover border-2 border-accent-400/30" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-ink-700/50 border border-ink-600 flex items-center justify-center"><UserRound size={20} className="text-ink-200/60" /></div>
                )}
                <div>
                  <h4 className="font-display text-sm text-ink-100">{protagonist.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-accent-400 uppercase tracking-wide font-medium">{t.characterPanel.protagonist}</span>
                    {protagonist.status && protagonist.status !== 'active' && (
                      <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${
                        protagonist.status === 'dead' ? 'bg-red-500/10 text-red-400' :
                        protagonist.status === 'injured' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>{t.entityStatus[protagonist.status]}</span>
                    )}
                  </div>
                </div>
              </button>
              <div className="space-y-1.5">
                {protagonist.dynamicStats.map(stat => (
                  <div key={stat.k}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-ink-200/70">{stat.k}</span>
                      <span className="text-ink-100 font-mono">{String(stat.v)}</span>
                    </div>
                    {stat.t === 'progress' && (
                      <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Number(stat.v))}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {npcs.length > 0 && (
            <div>
              <h4 className="font-display text-xs text-ink-200/60 uppercase tracking-wider mb-2">{t.characterPanel.storyCharacters}</h4>
              <div className="space-y-1">
                {sortedNpcs.map(npc => {
                  const isInactive = npc.status && npc.status !== 'active';
                  return (
                    <button key={npc._id} onClick={() => setDetailEntity({ type: 'character', data: npc })} className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-ink-800/50 transition-colors w-full text-left cursor-pointer ${isInactive ? 'opacity-50' : ''}`}>
                      {npc.imageUrl ? (
                        <img src={getImageUrl(npc.imageUrl)} alt={npc.name} className={`w-9 h-9 rounded-lg object-cover border border-ink-600 ${npc.status === 'dead' ? 'grayscale' : ''}`} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-ink-700/50 border border-ink-600 flex items-center justify-center">
                          {npc.status === 'dead' ? <Skull size={14} className="text-red-400/60" /> : <Users size={14} className="text-ink-200/60" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm truncate ${npc.status === 'dead' ? 'text-ink-200/50 line-through' : 'text-ink-100'}`}>{npc.name}</p>
                          {isInactive && (
                            <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
                              npc.status === 'dead' ? 'bg-red-500/10 text-red-400' :
                              npc.status === 'injured' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>{t.entityStatus[npc.status]}</span>
                          )}
                        </div>
                        <p className="text-ink-200/50 text-xs truncate">{npc.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!protagonist && npcs.length === 0 && (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noCharacters}</p>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {rpgTab === 'inventory' && (
        <div className="space-y-2 overflow-y-auto flex-1">
          {sortedItems.length > 0 ? sortedItems.map(item => {
            const isInactive = item.status && item.status !== 'active';
            return (
              <button key={item._id} onClick={() => setDetailEntity({ type: 'item', data: item })} className={`bg-ink-800/60 border border-ink-700 rounded-xl p-3 w-full text-left hover:bg-ink-800 hover:border-ink-600 transition-colors cursor-pointer ${isInactive ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-2.5">
                  {item.imageUrl ? (
                    <img src={getImageUrl(item.imageUrl)} alt={item.name} className={`w-9 h-9 rounded-lg object-cover border border-ink-600 shrink-0 ${isInactive ? 'grayscale' : ''}`} />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-ink-700/50 border border-ink-600 flex items-center justify-center shrink-0"><Package size={14} className="text-ink-200/60" /></div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${isInactive ? 'text-ink-200/50 line-through' : 'text-ink-100'}`}>{item.name}</p>
                      {isInactive && (
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
                          item.status === 'destroyed' ? 'bg-red-500/10 text-red-400' :
                          item.status === 'consumed' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>{t.entityStatus[item.status]}</span>
                      )}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide font-medium ${rarityColor[item.rarity]}`}>{t.rarity[item.rarity]}</span>
                  </div>
                </div>
                <p className="text-ink-200/60 text-xs mt-1.5 line-clamp-2">{item.description}</p>
              </button>
            );
          }) : (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noItems}</p>
          )}
        </div>
      )}

      {/* Abilities Tab */}
      {rpgTab === 'abilities' && (
        <div className="space-y-2 overflow-y-auto flex-1">
          {sortedSpecialItems.length > 0 ? sortedSpecialItems.map(si => {
            const isInactive = si.status && si.status !== 'active';
            return (
              <button key={si._id} onClick={() => setDetailEntity({ type: 'special', data: si })} className={`bg-ink-800/60 border border-ink-700 rounded-xl p-3 w-full text-left hover:bg-ink-800 hover:border-ink-600 transition-colors cursor-pointer ${isInactive ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-2.5">
                  {si.imageUrl ? (
                    <img src={getImageUrl(si.imageUrl)} alt={si.name} className={`w-9 h-9 rounded-lg object-cover border border-ink-600 shrink-0 ${isInactive ? 'grayscale' : ''}`} />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-purple-900/30 border border-purple-400/20 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-purple-400/60" /></div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${isInactive ? 'text-ink-200/50 line-through' : 'text-ink-100'}`}>{si.name}</p>
                      {isInactive && (
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${
                          si.status === 'sealed' ? 'bg-red-500/10 text-red-400' :
                          si.status === 'consumed' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>{t.entityStatus[si.status]}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-purple-400/80 bg-purple-400/10 px-1.5 py-0.5 rounded">{si.category}</span>
                      <span className={`text-[10px] uppercase tracking-wide font-medium ${rarityColor[si.rarity]}`}>{t.rarity[si.rarity]}</span>
                    </div>
                  </div>
                </div>
                <p className="text-ink-200/60 text-xs mt-1.5 line-clamp-2">{si.description}</p>
              </button>
            );
          }) : (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noSpecialItems}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex bg-ink-950 min-h-[calc(100vh-4rem)] relative">
      {/* Left sidebar — Chapter Navigation */}
      <div className="hidden lg:flex flex-col w-64 border-r border-ink-700 bg-ink-900/50 p-5 shrink-0">
        <h3 className="font-display text-sm text-ink-100 mb-4 border-b border-ink-700 pb-3 uppercase tracking-wider">{t.storyReader.storyNavigation}</h3>
        
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
                {t.storyNav.chapter} {ch.chapterIndex + 1}
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
          <div className="border-t border-ink-700 pt-3 mb-3">
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
                {t.storyNav.chapter} {activeChapter.chapterIndex + 1}{totalChapters > 0 ? ` / ${totalChapters}` : ''}
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

          {/* Generating state — loading overlay */}
          {isGenerating && (!latestChapter || !latestChapter.content) && (
            <div className="border-l-2 border-accent-400/30 pl-5 py-6 mt-4 bg-accent-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="flex items-center gap-3 text-ink-200/60">
                <svg className="animate-spin w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div>
                  <p className="text-sm font-sans font-medium text-ink-100">{t.storyReader.generatingChapter}</p>
                  <p className="text-xs font-sans text-ink-200/50 mt-0.5">{t.storyReader.generatingHint}</p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-4">
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}

          {/* Generating NEXT chapter — shown after existing content while API blocks */}
          {isGenerating && isOnLatest && latestChapter?.content && !isToolsRunning && (
            <div className="border-l-2 border-accent-400/30 pl-5 py-6 mt-8 bg-accent-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="flex items-center gap-3 text-ink-200/60">
                <svg className="animate-spin w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div>
                  <p className="text-sm font-sans font-medium text-ink-100">{t.storyReader.generatingChapter}</p>
                  <p className="text-xs font-sans text-ink-200/50 mt-0.5">{t.storyReader.generatingHint}</p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-4">
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
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

          <div ref={bottomRef} className="h-16" />
        </article>
      </div>

      {/* Right sidebar — RPG Panel (desktop) */}
      <div className="hidden xl:flex flex-col w-72 border-l border-ink-700 bg-ink-900/40 p-5 shrink-0 max-h-[calc(100vh-4rem)]">
        <h3 className="font-display text-sm text-ink-100 mb-4 border-b border-ink-700 pb-3 uppercase tracking-wider shrink-0">{t.storyReader.rpgPanel}</h3>
        {rpgPanelContent}
      </div>

      {/* Mobile RPG toggle */}
      <button
        onClick={() => setRpgOpen(!rpgOpen)}
        className="xl:hidden fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-ink-800 border border-ink-700 rounded-l-xl p-3 hover:border-accent-400/50 transition-all duration-200 shadow-lg"
        title={t.storyReader.rpgPanel}
      >
        <Swords size={18} className="text-ink-100" />
      </button>

      {/* Mobile RPG drawer */}
      <div className={`xl:hidden fixed right-0 top-0 h-full w-80 bg-ink-900 border-l border-ink-700 z-20 transform transition-transform duration-300 overflow-hidden flex flex-col ${rpgOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-display text-sm text-ink-100 uppercase tracking-wider">{t.storyReader.rpgPanel}</h3>
            <button onClick={() => setRpgOpen(false)} className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>
          {rpgPanelContent}
        </div>
      </div>

      {/* Mobile backdrop */}
      {rpgOpen && (
        <div className="xl:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setRpgOpen(false)} />
      )}

      {/* Entity Detail Modal */}
      <EntityDetailModal entity={detailEntity} onClose={() => setDetailEntity(null)} />
    </div>
  );
}
