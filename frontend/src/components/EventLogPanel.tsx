import { useState } from 'react';
import { Trash2, X, ScrollText, ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n';
import { listEvents, deleteEvent, deleteAllEvents, type EventLogEntry } from '../services/storyApi';
import { Spinner } from '../design-system/Spinner';
import { showError, showSuccess } from '../lib/toast';

interface EventLogPanelProps {
  playthroughId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SEVERITY_FILTERS = [
  { key: 'all', color: 'text-ink-200/60' },
  { key: 'error', color: 'text-red-400' },
  { key: 'warning', color: 'text-amber-400' },
  { key: 'info', color: 'text-blue-400' },
  { key: 'success', color: 'text-emerald-400' },
] as const;

function severityDotClass(severity: string): string {
  switch (severity) {
    case 'error': return 'bg-red-400';
    case 'warning': return 'bg-amber-400';
    case 'success': return 'bg-emerald-400';
    default: return 'bg-blue-400';
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function EventLogPanel({ playthroughId, isOpen, onClose }: EventLogPanelProps) {
  const t = useTranslation();
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'success'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = async (p: number, f: typeof filter) => {
    setLoading(true);
    try {
      const res = await listEvents(playthroughId, { page: p, limit: 50, severity: f === 'all' ? undefined : f });
      setEvents(res.events);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setPage(res.page);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load events:', err);
      showError(t.eventLog?.loadFailed ?? 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Load on open
  const handleOpen = () => {
    if (!loaded) load(1, filter);
  };

  if (!isOpen) return null;

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    load(1, f);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm(t.eventLog.confirmDelete)) return;
    try {
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      setTotal((prev) => Math.max(0, prev - 1));
      showSuccess(t.eventLog.deleted);
    } catch (err) {
      console.error('Failed to delete event:', err);
      showError(t.eventLog.deleteFailed);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(t.eventLog.confirmDeleteAll)) return;
    try {
      const res = await deleteAllEvents(playthroughId);
      setEvents([]);
      setTotal(0);
      setTotalPages(1);
      showSuccess(`${t.eventLog.deleted} (${res.deletedCount})`);
    } catch (err) {
      console.error('Failed to delete all events:', err);
      showError(t.eventLog.deleteFailed);
    }
  };

  const eventTypeLabel = (type: string): string => {
    const types = (t.eventLog?.types ?? {}) as Record<string, string>;
    return types[type] ?? type;
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" onMouseEnter={handleOpen}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-ink-900/95 border-l border-ink-200/10 shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200/10">
          <div className="flex items-center gap-2">
            <ScrollText size={18} className="text-accent-400" />
            <h2 className="text-base font-sans font-semibold text-ink-100">{t.eventLog.title}</h2>
            {total > 0 && (
              <span className="text-xs font-sans text-ink-200/40">{total}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-200/50 hover:text-ink-100 transition-colors p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-ink-200/10 overflow-x-auto">
          {SEVERITY_FILTERS.map((f) => {
            const labelKey = f.key === 'all' ? 'filterAll' : f.key === 'error' ? 'filterErrors' : f.key === 'warning' ? 'filterWarnings' : 'filterInfo';
            const label = (t.eventLog as Record<string, string>)[labelKey] ?? f.key;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-accent-400/15 text-accent-300 border border-accent-400/20'
                    : 'text-ink-200/50 hover:text-ink-200/80 border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
          <div className="flex-1" />
          {events.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-sans text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-colors whitespace-nowrap"
            >
              <Trash2 size={12} />
              {t.eventLog.deleteAll}
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" className="w-5 h-5 text-accent-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <ScrollText size={32} className="text-ink-200/20 mb-3" />
              <p className="text-sm font-sans text-ink-200/40">{t.eventLog.empty}</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {events.map((ev) => (
                <li
                  key={ev._id}
                  className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-200/5 transition-colors"
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${severityDotClass(ev.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-ink-100/90 leading-snug">{ev.title}</p>
                    {ev.description && (
                      <p className="text-xs font-sans text-ink-200/40 mt-0.5 break-words">{ev.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-sans text-ink-200/30 uppercase tracking-wide">
                        {eventTypeLabel(ev.type)}
                      </span>
                      <span className="text-[10px] font-sans text-ink-200/30">·</span>
                      <span className="text-[10px] font-sans text-ink-200/30">{formatDate(ev.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(ev._id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-200/30 hover:text-red-400 transition-all p-1 shrink-0"
                    aria-label={t.eventLog.delete}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-ink-200/10">
            <button
              onClick={() => load(Math.max(1, page - 1), filter)}
              disabled={page <= 1 || loading}
              className="text-xs font-sans text-ink-200/50 hover:text-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← {t.eventLog.prev ?? 'Prev'}
            </button>
            <span className="text-xs font-sans text-ink-200/40">{page} / {totalPages}</span>
            <button
              onClick={() => load(Math.min(totalPages, page + 1), filter)}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 text-xs font-sans text-ink-200/50 hover:text-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t.eventLog.loadMore} <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
