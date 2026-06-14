import { Link, useNavigate } from 'react-router-dom';
import { Trash2, FileText, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useDraftStore, type DraftEntry } from '../stores/draftStore';
import { Button } from '../design-system';

/**
 * /drafts — listing of all locally-stored drafts (world, character, choice).
 * Each row has a Restore link and a Discard button. Restoring a draft
 * navigates to the appropriate creation page; the draft is consumed
 * when the user starts typing (auto-save replaces it).
 */

const KIND_LABELS: Record<string, string> = {
  world: 'World',
  character: 'Character',
  choice: 'Choice',
};

const KIND_LINK: Record<string, string> = {
  world: '/worlds/create',
  character: '/worlds',
  choice: '/',
};

function formatKindLabel(kind: string, t: Record<string, unknown>): string {
  if (kind === 'world') return (t.worldCreate as Record<string, string> | undefined)?.title ?? 'World';
  if (kind === 'character') return (t.characterCreate as Record<string, string> | undefined)?.title ?? 'Character';
  return KIND_LABELS.choice;
}

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function describeDraft(entry: DraftEntry & { id: string }): string {
  const d = entry.data as Record<string, unknown>;
  if (entry.kind === 'world') {
    return (d.name as string) || '(Untitled world)';
  }
  if (entry.kind === 'character') {
    return (d.name as string) || '(Untitled character)';
  }
  // choice
  return ((d.choice as string) ?? '').slice(0, 80) || '(Empty choice)';
}

export default function DraftsPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const drafts = useDraftStore((s) => s.listAll());
  const clearWorld = useDraftStore((s) => s.clearWorld);
  const clearCharacter = useDraftStore((s) => s.clearCharacter);
  const clearChoice = useDraftStore((s) => s.clearChoice);

  const discard = (entry: DraftEntry & { id: string }) => {
    if (entry.kind === 'world') clearWorld();
    else if (entry.kind === 'character') clearCharacter();
    else clearChoice(entry.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display text-ink-100">
          {t.layout?.draftsTitle ?? 'Drafts'}
        </h1>
        <p className="text-ink-200/60 mt-2 text-sm">
          {t.layout?.draftsEmpty ?? 'No drafts yet. Your in-progress forms and choices will appear here.'}
        </p>
      </header>

      {drafts.length === 0 ? (
        <div className="rounded-3xl border border-ink-700/60 bg-ink-900/40 p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink-200/40" aria-hidden="true" />
          <p className="mt-4 text-ink-200/60 text-sm">
            {t.layout?.draftsEmpty ?? 'No drafts yet. Your in-progress forms and choices will appear here.'}
          </p>
          <Link
            to="/worlds"
            className="mt-6 inline-flex items-center gap-2 text-accent-400 hover:text-accent-500 text-sm font-medium"
          >
            {t.layout?.worlds ?? 'Worlds'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {drafts.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-3 rounded-2xl border border-ink-700/60 bg-ink-900/60 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold-400">
                  {formatKindLabel(entry.kind, t)}
                </p>
                <p className="mt-1 font-serif text-lg text-ink-100 truncate">
                  {describeDraft(entry)}
                </p>
                <p className="mt-0.5 text-xs text-ink-200/50">
                  {t.layout?.autosaveSaved ?? 'Draft saved'} · {formatUpdated(entry.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => discard(entry)}
                  aria-label={t.layout?.autosaveDiscard ?? 'Discard'}
                  className="text-ink-200 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => navigate(KIND_LINK[entry.kind] ?? '/')}
                >
                  {t.layout?.autosaveResume ?? 'Resume draft'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
