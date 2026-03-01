import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useStoryStream } from '../hooks/useStoryStream';
import { TypewriterText } from '../components/TypewriterText';
import * as storyApi from '../services/storyApi';

interface Chapter {
  _id: string;
  text: string;
  sequence: number;
}

interface Choice {
  _id: string;
  text: string;
  impact?: string;
}

export default function StoryReaderPage() {
  const { playthroughId } = useParams<{ playthroughId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(true);
  
  const { streamedText, isStreaming, isThinking, startStream, skipToEnd } = useStoryStream();
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new text streams in
  useEffect(() => {
    if (isStreaming || isThinking) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamedText, isStreaming, isThinking]);

  useEffect(() => {
    if (playthroughId) {
      loadStoryState();
    }
  }, [playthroughId]);
  
  // Reload state after stream finishes to get the newly created chapter and choices
  useEffect(() => {
    if (!isStreaming && streamedText && playthroughId) {
       loadStoryState();
    }
  }, [isStreaming]);

  const loadStoryState = async () => {
    try {
      setIsLoadingState(true);
      const state = await storyApi.getStoryState(playthroughId!);
      // Ensure state.chapters exists
      if (state.chapters) {
          setChapters(state.chapters);
      } else if (state.latestChapter) {
          // Fallback if API hasn't been fully updated yet to return full list
          setChapters([state.latestChapter]); 
      }
      setChoices(state.choices || []);
    } catch (error) {
      console.error('Failed to load story state:', error);
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleChoiceSelect = async (choiceId: string) => {
    if (!playthroughId || !token) return;
    try {
        await startStream(playthroughId, choiceId, token);
        setChoices([]); // Hide choices while streaming
    } catch (e) {
        console.error("Stream failed to start", e);
    }
  };

  if (isLoadingState && chapters.length === 0) {
    return <div className="p-8 text-ink-200">Loading story...</div>;
  }

  // Show previous chapters EXCEPT the very last one if we are currently streaming and it's rendering.
  // Actually, usually the backend won't have the new chapter saved until the stream ends,
  // so chapters list is perfectly fine to render fully.
  // We'll only show the stream if it's active.

  const visibleChapters = chapters.slice(-3); // Show last 3 chapters

  return (
    <div className="flex bg-ink-950 min-h-[calc(100vh-4rem)] relative">
      {/* Left sidebar: StoryNavigation (T27 Placeholder) */}
      <div className="hidden lg:block w-64 border-r border-ink-800 bg-ink-900/50 p-4 shrink-0">
        <h3 className="font-display text-ink-200 mb-4 border-b border-ink-800 pb-2">Story Navigation</h3>
        <p className="text-sm font-sans text-ink-200/50 italic">[ Story Navigation Component UI ]</p>
        <div className="mt-8">
            <button onClick={() => navigate(-1)} className="text-accent-400 hover:text-accent-500 text-sm flex items-center gap-1 font-sans">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Back to Playthrough
            </button>
        </div>
      </div>

      {/* Center: Reading column */}
      <div className="flex-1 overflow-y-auto">
        <article className="max-w-[65ch] mx-auto font-serif text-parchment-50 leading-relaxed text-lg py-8 px-4 md:py-16">
          
          {/* Previous Chapters Text Blocks */}
          <div className="space-y-8 md:space-y-12 mb-8">
            {visibleChapters.map((chapter) => (
              <div key={chapter._id} className="prose prose-invert prose-p:leading-relaxed prose-lg max-w-none text-parchment-50">
                {/* Minimal formatting for now - assumes text might have basic newlines */}
                {chapter.text.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Current Chapter Stream */}
          {(isStreaming || isThinking) && (
             <div className="border-l-2 border-accent-600/30 pl-4 py-2 mt-8 md:mt-12 bg-ink-900/20 rounded-r-xl">
                 <div className="prose prose-invert prose-p:leading-relaxed prose-lg max-w-none text-parchment-50">
                    <TypewriterText text={streamedText} isActive={isStreaming} className="whitespace-pre-wrap" />
                 </div>
                 
                 {isThinking && (
                    <div className="flex items-center gap-2 text-ink-200 py-4">
                        <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                        <span className="text-sm ml-2 font-sans">Weaving the story...</span>
                    </div>
                 )}

                 {isStreaming && !isThinking && (
                    <button 
                        onClick={skipToEnd} 
                        className="text-ink-200 text-sm underline hover:text-parchment-50 mt-4 font-sans block"
                    >
                        Skip to end
                    </button>
                 )}
             </div>
          )}

          {/* Choice Cards (T25 Placeholder) */}
          {!isStreaming && !isThinking && choices.length > 0 && (
            <div className="mt-16 md:mt-24 border-t border-ink-800 pt-8">
                <h3 className="font-display text-xl text-ink-100 mb-6 text-center">What do you do next?</h3>
                <div className="flex flex-col gap-4">
                    {/* Placeholder for T25 ChoiceCards. Just rendering basic buttons for now. */}
                    {choices.map((choice) => (
                        <button 
                            key={choice._id}
                            onClick={() => handleChoiceSelect(choice._id)}
                            className="bg-ink-800/80 hover:bg-ink-700 hover:ring-1 hover:ring-accent-500/50 
                                     border border-ink-700 text-left p-4 rounded-xl transition-all group"
                        >
                            <span className="font-serif text-lg text-ink-100 group-hover:text-accent-400 transition-colors">
                                {choice.text}
                            </span>
                            {choice.impact && (
                                <p className="font-sans text-xs text-ink-200/60 mt-2">
                                    Impact: {choice.impact}
                                </p>
                            )}
                        </button>
                    ))}
                </div>
            </div>
          )}

          {/* Dummy element for scrolling */}
          <div ref={bottomRef} className="h-16" />
        </article>
      </div>

      {/* Right sidebar: CharacterPanel (T26 Placeholder) */}
      <div className="hidden xl:block w-72 border-l border-ink-800 bg-ink-900/40 p-4 shrink-0 overflow-y-auto">
        <h3 className="font-display text-ink-200 mb-4 border-b border-ink-800 pb-2">Active Characters</h3>
        <p className="text-sm font-sans text-ink-200/50 italic">[ Character Panel Component UI ]</p>
      </div>

    </div>
  );
}
