import { useState } from 'react';
import { Check, Play } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Arc {
  _id: string;
  title: string;
  arcIndex: number;
  status: 'active' | 'completed';
  summary?: string;
}

interface Chapter {
  _id: string;
  chapterIndex: number;
  arcId: string;
}

interface StoryNavigationProps {
  arcs: Arc[];
  chapters: Chapter[];
  currentChapterId?: string;
  onChapterClick?: (chapterId: string) => void;
}

export function StoryNavigation({ arcs, chapters, currentChapterId, onChapterClick }: StoryNavigationProps) {
  const t = useTranslation();
  const [expandedArcs, setExpandedArcs] = useState<Set<string>>(new Set());

  const toggleArc = (arcId: string) => {
    setExpandedArcs(prev => {
      const next = new Set(prev);
      if (next.has(arcId)) next.delete(arcId); else next.add(arcId);
      return next;
    });
  };

  const getChaptersForArc = (arcId: string) => {
    const arcChapters = chapters.filter(c => c.arcId === arcId);
    // Compute display indices based on position in full chapter list
    return arcChapters.map(c => ({
      ...c,
      displayIndex: chapters.indexOf(c),
    }));
  };

  return (
    <div className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto p-4">
        <h3 className="font-display text-xs text-ink-200/60 uppercase tracking-wider mb-4">{t.storyNav.storyProgress}</h3>
        <div className="space-y-1.5">
          {arcs.map(arc => {
            const arcChapters = getChaptersForArc(arc._id);
            const isExpanded = expandedArcs.has(arc._id) || arc.status === 'active';
            return (
              <div key={arc._id}>
                <button
                  onClick={() => toggleArc(arc._id)}
                  className="w-full text-left flex items-center gap-2 text-ink-100 hover:text-accent-400 transition-colors py-1.5 px-2 rounded-lg hover:bg-ink-800/50"
                >
                  <span className={`${arc.status === 'completed' ? 'text-green-400' : 'text-accent-400'}`}>
                    {arc.status === 'completed' ? <Check size={12} /> : <Play size={12} />}
                  </span>
                  <span className="font-display text-sm">{arc.title}</span>
                  <span className="ml-auto text-xs text-ink-200/40">{arcChapters.length}</span>
                </button>

                {isExpanded && arc.summary && (
                  <p className="text-xs text-ink-200/50 ml-7 mt-0.5 mb-1.5 leading-relaxed line-clamp-3">{arc.summary}</p>
                )}

                {isExpanded && arcChapters.map(ch => (
                  <button
                    key={ch._id}
                    onClick={() => onChapterClick?.(ch._id)}
                    className={`w-full text-left text-xs ml-7 py-1.5 px-2.5 rounded-lg transition-all duration-200 ${
                      ch._id === currentChapterId
                        ? 'bg-accent-600/15 text-accent-400 font-medium'
                        : 'text-ink-200/60 hover:text-ink-100 hover:bg-ink-800/50'
                    }`}
                  >
                    {t.storyNav.chapter} {ch.displayIndex + 1}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
