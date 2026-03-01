import { useState } from 'react';

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
  const [expandedArcs, setExpandedArcs] = useState<Set<string>>(new Set());

  const toggleArc = (arcId: string) => {
    setExpandedArcs(prev => {
      const next = new Set(prev);
      if (next.has(arcId)) next.delete(arcId); else next.add(arcId);
      return next;
    });
  };

  const getChaptersForArc = (arcId: string) => chapters.filter(c => c.arcId === arcId);

  return (
    <div className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <h3 className="font-display text-sm text-ink-200 uppercase tracking-wide mb-3">Story Progress</h3>
        <div className="space-y-2">
          {arcs.map(arc => {
            const arcChapters = getChaptersForArc(arc._id);
            const isExpanded = expandedArcs.has(arc._id) || arc.status === 'active';
            return (
              <div key={arc._id}>
                <button
                  onClick={() => toggleArc(arc._id)}
                  className="w-full text-left flex items-center gap-2 text-parchment-50 hover:text-accent-400 transition-colors"
                >
                  <span className={`text-xs ${arc.status === 'completed' ? 'text-green-400' : 'text-accent-400'}`}>
                    {arc.status === 'completed' ? '✓' : '▶'}
                  </span>
                  <span className="font-display text-sm">{arc.title}</span>
                  <span className="ml-auto text-xs text-ink-200">{arcChapters.length}</span>
                </button>

                {isExpanded && arc.summary && (
                  <p className="text-xs text-ink-200 ml-4 mt-1 mb-2 leading-relaxed line-clamp-3">{arc.summary}</p>
                )}

                {isExpanded && arcChapters.map(ch => (
                  <button
                    key={ch._id}
                    onClick={() => onChapterClick?.(ch._id)}
                    className={`w-full text-left text-xs ml-4 py-1 px-2 rounded transition-colors ${
                      ch._id === currentChapterId
                        ? 'bg-accent-600/30 text-accent-400'
                        : 'text-ink-200 hover:text-parchment-50'
                    }`}
                  >
                    Chapter {ch.chapterIndex + 1}
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
