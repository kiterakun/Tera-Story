import { useParams } from 'react-router-dom';
import { useChronicle } from '../hooks/useChronicle';
import type { ArcSummary } from '../services/chronicleApi';
import {
  ScrollText, BookOpen, GitBranch, Swords, Clock, Share2, ChevronDown, ChevronUp, Image,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useState } from 'react';
import { ExportMenu } from '../components/ExportMenu';
import { ShareDialog } from '../components/ShareDialog';

function ArcSection({
  arc,
  index,
  isLast,
  isCurrent,
}: {
  arc: ArcSummary;
  index: number;
  isLast: boolean;
  isCurrent: boolean;
}) {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          isCurrent
            ? 'border-gold-400 bg-gold-500/20'
            : arc.summary.length > 20
              ? 'border-gold-400 bg-gold-500'
              : 'border-ink-600 bg-ink-800'
        }`}
      >
        {isCurrent ? <div className="h-2 w-2 rounded-full bg-gold-500" /> : null}
      </div>

      {/* Timeline line */}
      {!isLast && <div className="absolute left-1.5 top-5 h-full w-0.5 bg-ink-700" />}

      <div className="pb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gold-400">
            {t.chronicle.arcLabel.replace('{count}', String(index + 1))}: {arc.title}
          </h3>
          <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-ink-400">
            {arc.sceneCount} {t.chronicle.scenes}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-narration">{arc.summary}</p>

        {/* Key scene thumbnails */}
        {arc.keyScenes.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {arc.keyScenes.map((scene) => (
              <div
                key={scene.sceneId}
                className="shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-800"
                style={{ width: 48, height: 48 }}
                title={scene.title}
              >
                {scene.thumbnailUrl ? (
                  <img
                    src={scene.thumbnailUrl}
                    alt={scene.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-600">
                    <Image size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Expand for more scenes */}
        {arc.sceneCount > arc.keyScenes.length && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} /> {t.chronicle.collapse}
              </>
            ) : (
              <>
                <ChevronDown size={14} /> {t.chronicle.seeAll.replace('{count}', String(arc.sceneCount))}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ChronicleSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-8 h-8 w-64 animate-pulse rounded bg-ink-800" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative pl-8">
            <div className="absolute left-0 top-1.5 h-4 w-4 animate-pulse rounded-full bg-ink-800" />
            <div className="h-5 w-48 animate-pulse rounded bg-ink-800" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-ink-800" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-ink-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChroniclePage() {
  const t = useTranslation();
  const { playthroughId } = useParams<{ playthroughId: string }>();
  const { chronicle, isLoading, error, refetch } = useChronicle(playthroughId ?? '');
  const [shareOpen, setShareOpen] = useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={refetch} className="mt-4 rounded-lg bg-gold-500 px-4 py-2 text-sm text-ink-950 hover:bg-gold-500/80">
          {t.chronicle.retry}
        </button>
      </div>
    );
  }

  if (isLoading) return <ChronicleSkeleton />;

  if (!chronicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ScrollText size={48} className="text-ink-600" />
        <p className="mt-4 text-lg text-narration">{t.chronicle.empty}</p>
        <p className="mt-1 text-sm text-ink-500">{t.chronicle.emptyHint}</p>
      </div>
    );
  }

  const data = chronicle.chronicle;
  const stats = data?.stats;


  return (
    <div className="p-4 md:p-6">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gold-400">{chronicle.playthroughName}</h1>
            <p className="mt-1 text-sm text-narration">
              {chronicle.status === 'completed' ? t.chronicle.completed : t.chronicle.inProgress}
            </p>
          </div>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-300 hover:bg-ink-800 transition-colors"
          >
            <Share2 size={16} /> {t.chronicle.share}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-ink-800 bg-ink-900/50 p-4 text-center">
          <BookOpen size={20} className="mx-auto text-gold-400" />
          <p className="mt-2 text-2xl font-bold text-ink-200">{stats?.totalScenes ?? '-'}</p>
          <p className="text-xs text-ink-500">{t.chronicle.sceneLabel}</p>
        </div>
        <div className="rounded-lg border border-ink-800 bg-ink-900/50 p-4 text-center">
          <GitBranch size={20} className="mx-auto text-gold-400" />
          <p className="mt-2 text-2xl font-bold text-ink-200">{stats?.totalChoices ?? '-'}</p>
          <p className="text-xs text-ink-500">{t.chronicle.choiceLabel}</p>
        </div>
        <div className="rounded-lg border border-ink-800 bg-ink-900/50 p-4 text-center">
          <Swords size={20} className="mx-auto text-gold-400" />
          <p className="mt-2 text-2xl font-bold text-ink-200">{stats?.totalCombats ?? '-'}</p>
          <p className="text-xs text-ink-500">{t.chronicle.battleLabel}</p>
        </div>
        <div className="rounded-lg border border-ink-800 bg-ink-900/50 p-4 text-center">
          <Clock size={20} className="mx-auto text-gold-400" />
          <p className="mt-2 text-2xl font-bold text-ink-200">
            {stats?.totalPlayTimeMinutes != null 
              ? t.chronicle.timeUnit.replace('{count}', String(Math.round(stats.totalPlayTimeMinutes))) 
              : '-'}
          </p>
          <p className="text-xs text-ink-500">{t.chronicle.timeLabel}</p>
        </div>
      </div>

      {/* Timeline */}
      {data?.arcSummaries && data.arcSummaries.length > 0 ? (
        <div className="border-l-2 border-ink-700">
          {data.arcSummaries.map((arc, idx) => (
            <ArcSection
              key={arc.arcId}
              arc={arc}
              index={idx}
              isLast={idx === data.arcSummaries.length - 1}
              isCurrent={idx === data.arcSummaries.length - 1 && chronicle.status === 'active'}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-ink-500">{t.chronicle.noArcData}</p>
        </div>
      )}

      {playthroughId && (
        <section className="mt-10 rounded-3xl border border-gold-400/20 bg-ink-900/60 p-6">
          <h2 className="font-display text-lg text-ink-100 mb-3">Export &amp; share</h2>
          <p className="text-sm text-ink-200/70 mb-4">
            Download your saga as a PDF, Markdown, or ePub. Or share a public link.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ExportMenu playthroughId={playthroughId} />
          </div>
        </section>
      )}

      <ShareDialog
        playthroughId={playthroughId ?? ''}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
