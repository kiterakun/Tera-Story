import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, MapPin, BookOpen, Sparkles } from 'lucide-react';
import { Button, Card, CardBody } from '../design-system';

/**
 * /share/:token — public read-only page showing a playthrough snapshot.
 * No auth required. Cinematic dark + gold layout matching the landing
 * page. Loaded via /api/v1/share/:token (envelope shape).
 */

interface Chapter {
  index: number;
  title: string;
  content: string;
}

interface Snapshot {
  name: string;
  worldName: string;
  worldId: string;
  status: 'active' | 'paused' | 'completed';
  completedAt: string | null;
  chapters: Chapter[];
  owner: { username: string; displayName?: string };
  sharedAt: string;
  expiresAt: string;
}

const API = '/api/v1/share/token';

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // Defer setState out of the effect body to avoid cascading renders.
    const timer = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      fetch(`${API}/${token}`)
        .then((r) => r.json())
        .then((body) => {
          if (cancelled) return;
          if (body?.status === 'success' && body.data) {
            setSnapshot(body.data as Snapshot);
          } else {
            setError(body?.error ?? 'Share link not found or expired');
          }
        })
        .catch(() => {
          if (!cancelled) setError('Failed to load shared story');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-ink-200">
        <p className="text-ink-200/60">Loading shared story…</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-ink-200 p-6">
        <Card variant="elevated" className="max-w-md w-full">
          <CardBody>
            <h1 className="font-display text-xl text-ink-100 mb-2">Link unavailable</h1>
            <p className="text-ink-200/70 text-sm">
              {error ?? 'This share link may have expired or been removed.'}
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm text-gold-400 hover:text-gold-500"
            >
              ← Back to Tera-Story
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const ownerName = snapshot.owner.displayName ?? snapshot.owner.username;

  return (
    <div className="min-h-screen overflow-hidden bg-ink-950 text-ink-200">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(79,70,229,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,1)_48%,rgba(0,0,0,1))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(252,211,77,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(252,211,77,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      </div>

      <header className="relative z-10 border-b border-ink-700/50 bg-ink-950/55 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-display text-lg text-gold-400">Tera-Story</Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-ink-200">
              Create your own →
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        <article className="rounded-3xl border border-gold-400/20 bg-ink-900/80 backdrop-blur-md shadow-2xl shadow-black/40 p-6 sm:p-10 animate-fade-in">
          <header className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-400 mb-3">
              Shared story
            </p>
            <h1 className="font-display text-4xl sm:text-5xl text-ink-100 leading-tight">
              {snapshot.name}
            </h1>
            <p className="mt-3 text-ink-200/70">
              A {snapshot.status} tale from {snapshot.worldName}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-950/40 px-3 py-1 text-ink-200/70">
                <BookOpen className="h-3 w-3" aria-hidden="true" /> {snapshot.chapters.length} chapters
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-950/40 px-3 py-1 text-ink-200/70">
                <MapPin className="h-3 w-3" aria-hidden="true" /> {snapshot.worldName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-950/40 px-3 py-1 text-ink-200/70">
                <Sparkles className="h-3 w-3" aria-hidden="true" /> by {ownerName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-700/60 bg-ink-950/40 px-3 py-1 text-ink-200/70">
                <Calendar className="h-3 w-3" aria-hidden="true" /> expires {new Date(snapshot.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </header>

          {snapshot.chapters.length > 0 && (
            <section className="mb-8 rounded-2xl border border-ink-700/40 bg-ink-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400 mb-2">
                Table of contents
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-ink-200/80">
                {snapshot.chapters.map((c) => (
                  <li key={c.index}>
                    <a
                      href={`#chapter-${c.index}`}
                      className="hover:text-gold-400 transition-colors"
                    >
                      {c.title}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="space-y-6">
            {snapshot.chapters.map((c) => (
              <section
                key={c.index}
                id={`chapter-${c.index}`}
                className="rounded-2xl border border-ink-700/40 bg-ink-950/30 p-5 sm:p-6"
              >
                <h2 className="font-display text-2xl text-gold-400 mb-3">{c.title}</h2>
                <p className="whitespace-pre-wrap font-serif text-base leading-8 text-ink-100/90">
                  {c.content}
                </p>
              </section>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
