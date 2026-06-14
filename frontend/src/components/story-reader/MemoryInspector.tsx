import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import { Card, CardBody } from '../../design-system';
import { Users, Package, Sparkles, Building2, MapPin, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * MemoryInspector — fetches the AI-known entity snapshot for a
 * playthrough from /api/v1/playthroughs/:id/memory and renders it as
 * expandable groups. Read-only; refreshes on playthroughId change.
 */

export interface MemoryCharacter {
  _id: string;
  name: string;
  role: string;
  status: string;
}
export interface MemoryItem {
  _id: string;
  name: string;
  rarity: string;
}
export interface MemorySpecialItem {
  _id: string;
  name: string;
  category: string;
}
export interface MemoryOrganization {
  _id: string;
  name: string;
  status: string;
}
export interface MemoryLocation {
  _id: string;
  name: string;
  description: string;
}
export interface MemorySnapshot {
  characters: MemoryCharacter[];
  items: MemoryItem[];
  specialItems: MemorySpecialItem[];
  organizations: MemoryOrganization[];
  currentLocation: MemoryLocation | null;
}

const API = '/api/v1/playthroughs';

async function fetchMemory(playthroughId: string): Promise<MemorySnapshot | null> {
  const res = await fetch(`${API}/${playthroughId}/memory`, { credentials: 'include' });
  const body = await res.json();
  if (body?.status === 'success' && body.data) return body.data as MemorySnapshot;
  return null;
}

interface GroupProps {
  title: string;
  icon: typeof Users;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
function Group({ title, icon: Icon, count, defaultOpen = false, children }: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-ink-700/60 bg-ink-950/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <Icon className="h-4 w-4 text-gold-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink-100">{title}</span>
        <span className="ml-1 text-xs text-ink-200/50">({count})</span>
        <span className="ml-auto text-ink-200/50">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </section>
  );
}

export interface MemoryInspectorProps {
  playthroughId: string;
}

export function MemoryInspector({ playthroughId }: MemoryInspectorProps) {
  // Memory-related strings are spread from ui.ts at the top level, so we
  // widen the translation type to allow string|undefined.
  const t = useTranslation() as Record<string, string | undefined>;

  const [data, setData] = useState<MemorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Use a microtask defer to avoid synchronous setState-in-effect lint.
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setLoading(true);
        return fetchMemory(playthroughId);
      })
      .then((d) => {
        if (cancelled || !d) return;
        setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playthroughId]);

  if (loading) {
    return <p className="text-sm text-ink-200/60">Loading…</p>;
  }
  if (!data) {
    return (
      <p className="text-sm text-ink-200/60">
        {t.memoryEmpty ?? 'No entities recorded yet.'}
      </p>
    );
  }

  const empty = t.memoryEmpty ?? 'No entities recorded yet.';
  return (
    <Card variant="panel" className="border-gold-400/20 bg-ink-900/60">
      <CardBody>
        <header className="mb-4">
          <h3 className="font-display text-lg text-ink-100">
            {t.memoryTitle ?? 'Memory inspector'}
          </h3>
          <p className="text-xs text-ink-200/60 mt-1">
            {t.memorySubtitle ?? 'What the AI currently knows about this story.'}
          </p>
        </header>

        <div className="space-y-2">
          <Group title="Characters" icon={Users} count={data.characters.length} defaultOpen>
            {data.characters.length === 0 ? (
              <p className="text-xs text-ink-200/50">{empty}</p>
            ) : (
              <ul className="space-y-1" role="list">
                {data.characters.map((c) => (
                  <li key={c._id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-100">{c.name}</span>
                    <span className="text-ink-200/50">{c.role} · {c.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Group>

          <Group title="Items" icon={Package} count={data.items.length}>
            {data.items.length === 0 ? (
              <p className="text-xs text-ink-200/50">{empty}</p>
            ) : (
              <ul className="space-y-1" role="list">
                {data.items.map((it) => (
                  <li key={it._id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-100">{it.name}</span>
                    <span className="text-ink-200/50">{it.rarity}</span>
                  </li>
                ))}
              </ul>
            )}
          </Group>

          <Group title="Special items" icon={Sparkles} count={data.specialItems.length}>
            {data.specialItems.length === 0 ? (
              <p className="text-xs text-ink-200/50">{empty}</p>
            ) : (
              <ul className="space-y-1" role="list">
                {data.specialItems.map((s) => (
                  <li key={s._id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-100">{s.name}</span>
                    <span className="text-ink-200/50">{s.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </Group>

          <Group title="Organizations" icon={Building2} count={data.organizations.length}>
            {data.organizations.length === 0 ? (
              <p className="text-xs text-ink-200/50">{empty}</p>
            ) : (
              <ul className="space-y-1" role="list">
                {data.organizations.map((o) => (
                  <li key={o._id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-100">{o.name}</span>
                    <span className="text-ink-200/50">{o.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Group>

          <Group title="Current location" icon={MapPin} count={data.currentLocation ? 1 : 0}>
            {data.currentLocation ? (
              <div className="text-xs">
                <p className="text-ink-100">{data.currentLocation.name}</p>
                {data.currentLocation.description && (
                  <p className="text-ink-200/60 mt-0.5 line-clamp-3">
                    {data.currentLocation.description}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-200/50">{empty}</p>
            )}
          </Group>
        </div>
      </CardBody>
    </Card>
  );
}
