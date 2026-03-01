import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useStoryStream } from '../hooks/useStoryStream';
import { TypewriterText } from '../components/TypewriterText';
import * as storyApi from '../services/storyApi';
import { useStoryStore } from '../stores/storyStore';
import { useTranslation } from '../i18n';
import { UserRound, Users, Package, Sparkles, Swords, X, BookOpen } from 'lucide-react';
import type { ItemRarity } from '../services/playthroughApi';

// Matches backend Chapter model
interface Chapter {
  _id: string;
  content: string;
  chapterIndex: number;
  choices: Choice[];
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
  const [rpgTab, setRpgTab] = useState<'stats' | 'inventory' | 'abilities'>('stats');
  const [rpgOpen, setRpgOpen] = useState(false);
  
  const { streamedText, isStreaming, isThinking, startStream, skipToEnd } = useStoryStream();
  
  // Individual selectors to avoid getSnapshot infinite loop
  const characters = useStoryStore(s => s.characters);
  const items = useStoryStore(s => s.items);
  const specialItems = useStoryStore(s => s.specialItems);
  const fetchCharacters = useStoryStore(s => s.fetchCharacters);
  const fetchItems = useStoryStore(s => s.fetchItems);
  const fetchSpecialItems = useStoryStore(s => s.fetchSpecialItems);
  
  const protagonist = characters.find(c => c.role === 'protagonist') || null;
  const npcs = characters.filter(c => c.role === 'npc');

  const tabLabels = {
    stats: t.storyReader.statsTab,
    inventory: t.storyReader.inventoryTab,
    abilities: t.storyReader.abilitiesTab,
  };
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (isStreaming || isThinking) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamedText, isStreaming, isThinking]);

  useEffect(() => {
    if (playthroughId) {
      loadStoryState();
      fetchCharacters(playthroughId).catch(console.error);
      fetchItems(playthroughId).catch(console.error);
      fetchSpecialItems(playthroughId).catch(console.error);
    }
  }, [playthroughId]);
  
  useEffect(() => {
    if (!isStreaming && streamedText && playthroughId) {
       loadStoryState();
       fetchCharacters(playthroughId).catch(console.error);
       fetchItems(playthroughId).catch(console.error);
       fetchSpecialItems(playthroughId).catch(console.error);
    }
  }, [isStreaming]);

  const loadStoryState = async () => {
    try {
      setIsLoadingState(true);
      const state = await storyApi.getStoryState(playthroughId!);
      
      // Backend returns chapters array now
      if (state.chapters && state.chapters.length > 0) {
        setChapters(state.chapters);
      } else if (state.latestChapter) {
        setChapters([state.latestChapter]);
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

  // Send the choice text (not _id, since choices have _id: false)
  const handleChoiceSelect = async (choiceText: string) => {
    if (!playthroughId || !token) return;
    try {
        await startStream(playthroughId, choiceText, token);
        setChoices([]);
        setIsNewGame(false);
    } catch (e) {
        console.error("Stream failed to start", e);
    }
  };

  // Begin story for fresh playthroughs
  const handleBeginStory = async () => {
    if (!playthroughId || !token) return;
    try {
      await startStream(playthroughId, 'Begin the story', token);
      setIsNewGame(false);
      setChoices([]);
    } catch (e) {
      console.error("Failed to begin story", e);
    }
  };

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

  const visibleChapters = chapters.slice(-3);

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
              <div className="flex items-center gap-3 mb-3">
                {protagonist.imageUrl ? (
                  <img src={protagonist.imageUrl} alt={protagonist.name} className="w-12 h-12 rounded-xl object-cover border-2 border-accent-400/30" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-ink-700/50 border border-ink-600 flex items-center justify-center"><UserRound size={20} className="text-ink-200/60" /></div>
                )}
                <div>
                  <h4 className="font-display text-sm text-ink-100">{protagonist.name}</h4>
                  <span className="text-[10px] text-accent-400 uppercase tracking-wide font-medium">{t.characterPanel.protagonist}</span>
                </div>
              </div>
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
              <div className="space-y-2">
                {npcs.map(npc => (
                  <div key={npc._id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-ink-800/50 transition-colors">
                    {npc.imageUrl ? (
                      <img src={npc.imageUrl} alt={npc.name} className="w-9 h-9 rounded-lg object-cover border border-ink-600" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-ink-700/50 border border-ink-600 flex items-center justify-center"><Users size={14} className="text-ink-200/60" /></div>
                    )}
                    <div className="min-w-0">
                      <p className="text-ink-100 text-sm truncate">{npc.name}</p>
                      <p className="text-ink-200/50 text-xs truncate">{npc.description}</p>
                    </div>
                  </div>
                ))}
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
          {items.length > 0 ? items.map(item => (
            <div key={item._id} className="bg-ink-800/60 border border-ink-700 rounded-xl p-3">
              <div className="flex items-start gap-2.5">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-ink-600 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-ink-700/50 border border-ink-600 flex items-center justify-center shrink-0"><Package size={14} className="text-ink-200/60" /></div>
                )}
                <div className="min-w-0">
                  <p className="text-ink-100 text-sm font-medium truncate">{item.name}</p>
                  <span className={`text-[10px] uppercase tracking-wide font-medium ${rarityColor[item.rarity]}`}>{t.rarity[item.rarity]}</span>
                </div>
              </div>
              <p className="text-ink-200/60 text-xs mt-1.5 line-clamp-2">{item.description}</p>
            </div>
          )) : (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noItems}</p>
          )}
        </div>
      )}

      {/* Abilities Tab */}
      {rpgTab === 'abilities' && (
        <div className="space-y-2 overflow-y-auto flex-1">
          {specialItems.length > 0 ? specialItems.map(si => (
            <div key={si._id} className="bg-ink-800/60 border border-ink-700 rounded-xl p-3">
              <div className="flex items-start gap-2.5">
                {si.imageUrl ? (
                  <img src={si.imageUrl} alt={si.name} className="w-9 h-9 rounded-lg object-cover border border-ink-600 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-purple-900/30 border border-purple-400/20 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-purple-400/60" /></div>
                )}
                <div className="min-w-0">
                  <p className="text-ink-100 text-sm font-medium truncate">{si.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-purple-400/80 bg-purple-400/10 px-1.5 py-0.5 rounded">{si.category}</span>
                    <span className={`text-[10px] uppercase tracking-wide font-medium ${rarityColor[si.rarity]}`}>{t.rarity[si.rarity]}</span>
                  </div>
                </div>
              </div>
              <p className="text-ink-200/60 text-xs mt-1.5 line-clamp-2">{si.description}</p>
            </div>
          )) : (
            <p className="text-ink-200/40 text-sm italic">{t.characterPanel.noSpecialItems}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex bg-ink-950 min-h-[calc(100vh-4rem)] relative">
      {/* Left sidebar */}
      <div className="hidden lg:block w-64 border-r border-ink-700 bg-ink-900/50 p-5 shrink-0">
        <h3 className="font-display text-sm text-ink-100 mb-4 border-b border-ink-700 pb-3 uppercase tracking-wider">{t.storyReader.storyNavigation}</h3>
        <p className="text-sm text-ink-200/40 italic">{t.storyReader.navigationPanel}</p>
        <div className="mt-8">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-accent-400 hover:text-accent-500 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
            {t.storyReader.backToPlaythrough}
          </button>
        </div>
      </div>

      {/* Center: Reading column */}
      <div className="flex-1 overflow-y-auto">
        <article className="max-w-[65ch] mx-auto font-serif text-ink-100 leading-[1.8] text-lg py-8 px-4 md:py-16">

          {/* Begin Story — fresh playthrough with no chapters */}
          {isNewGame && chapters.length === 0 && !isStreaming && !isThinking && (
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
          
          {/* Previous Chapters */}
          <div className="space-y-8 md:space-y-12 mb-8">
            {visibleChapters.map((chapter) => (
              <div key={chapter._id} className="text-ink-200/90">
                {chapter.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 leading-[1.8]">{paragraph}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Current Chapter Stream */}
          {(isStreaming || isThinking) && (
            <div className="border-l-2 border-accent-400/30 pl-5 py-3 mt-8 md:mt-12 bg-accent-400/[0.03] rounded-r-2xl animate-fade-in">
              <div className="text-ink-200/90">
                <TypewriterText text={streamedText} isActive={isStreaming} className="whitespace-pre-wrap" />
              </div>
               
              {isThinking && (
                <div className="flex items-center gap-2 text-ink-200/50 py-4">
                  <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="text-sm ml-1 font-sans">{t.storyReader.weavingStory}</span>
                </div>
              )}

              {isStreaming && !isThinking && (
                <button 
                  onClick={skipToEnd} 
                  className="text-ink-200/50 text-sm hover:text-accent-400 mt-4 font-sans transition-colors"
                >
                  {t.storyReader.skipToEnd}
                </button>
              )}
            </div>
          )}

          {/* Choice Cards */}
          {!isStreaming && !isThinking && choices.length > 0 && (
            <div className="mt-16 md:mt-24 border-t border-ink-700 pt-8 animate-fade-in">
              <h3 className="font-display text-lg text-ink-100 mb-6 text-center">{t.storyReader.whatDoYouDoNext}</h3>
              <div className="flex flex-col gap-3">
                {choices.map((choice, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleChoiceSelect(choice.text)}
                    className="group bg-ink-800/60 hover:bg-ink-800 border border-ink-700 hover:border-accent-400/40 text-left p-5 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-accent-400/5"
                  >
                    <span className="font-serif text-base text-ink-200 group-hover:text-ink-100 transition-colors leading-relaxed">
                      {choice.text}
                    </span>
                  </button>
                ))}
              </div>
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
    </div>
  );
}
