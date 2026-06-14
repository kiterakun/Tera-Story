import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import { Button, Card, CardBody } from '../../design-system';
import { showSuccess, showError } from '../../lib/toast';
import {
  DEFAULT_DIRECTOR,
  fetchDirector,
  putDirector,
  type DirectorSettings,
  type Pacing,
  type Tone,
} from './directorModel';

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}
function Slider({ label, value, onChange, min = 0, max = 100 }: SliderProps) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-200/70">
          {label}
        </span>
        <span className="text-xs font-mono text-gold-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold-500"
        aria-label={label}
      />
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  labels: Record<T, string>;
}
function Segmented<T extends string>({ label, value, options, onChange, labels }: SegmentedProps<T>) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-200/70 mb-2">{label}</p>
      <div className="inline-flex rounded-xl border border-ink-700/70 bg-ink-900/40 p-1">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                active
                  ? 'bg-gold-500/20 text-gold-400 shadow-gold'
                  : 'text-ink-200/70 hover:text-ink-100'
              }`}
              aria-pressed={active}
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface DirectorPanelProps {
  playthroughId: string;
}

export function DirectorPanel({ playthroughId }: DirectorPanelProps) {
  const t = useTranslation() as Record<string, string | undefined>;

  const [state, setState] = useState<DirectorSettings>(DEFAULT_DIRECTOR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDirector(playthroughId)
      .then((d) => {
        if (!cancelled) setState(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playthroughId]);

  const set = <K extends keyof DirectorSettings>(key: K, value: DirectorSettings[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  const onReset = () => setState(DEFAULT_DIRECTOR);

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await putDirector(playthroughId, state);
      if (updated) {
        setState(updated);
        showSuccess(t.directorSaved ?? 'Director settings saved');
      } else {
        showError(t.directorSaveFailed ?? 'Failed to save director settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const toneLabels: Record<Tone, string> = {
    serious: t.directorToneSerious ?? 'Serious',
    balanced: t.directorToneBalanced ?? 'Balanced',
    whimsical: t.directorToneWhimsical ?? 'Whimsical',
  };
  const pacingLabels: Record<Pacing, string> = {
    slow: t.directorPacingSlow ?? 'Slow',
    normal: t.directorPacingNormal ?? 'Normal',
    fast: t.directorPacingFast ?? 'Fast',
  };

  if (loading) {
    return <p className="text-sm text-ink-200/60">Loading…</p>;
  }

  return (
    <Card variant="panel" className="border-gold-400/20 bg-ink-900/60">
      <CardBody>
        <header className="mb-4">
          <h3 className="font-display text-lg text-ink-100">
            {t.directorTitle ?? 'Director mode'}
          </h3>
          <p className="text-xs text-ink-200/60 mt-1">
            {t.directorSubtitle ?? 'Tune the narrative style of the AI writer for this playthrough.'}
          </p>
        </header>

        <div className="space-y-5">
          <Segmented
            label={t.directorTone ?? 'Tone preset'}
            value={state.tone}
            options={['serious', 'balanced', 'whimsical'] as const}
            onChange={(v) => set('tone', v)}
            labels={toneLabels}
          />
          <Slider
            label={t.directorDanger ?? 'Danger'}
            value={state.danger}
            onChange={(v) => set('danger', v)}
          />
          <Slider
            label={t.directorRomance ?? 'Romance'}
            value={state.romance}
            onChange={(v) => set('romance', v)}
          />
          <Slider
            label={t.directorComedy ?? 'Comedy'}
            value={state.comedy}
            onChange={(v) => set('comedy', v)}
          />
          <Segmented
            label={t.directorPacing ?? 'Pacing'}
            value={state.pacing}
            options={['slow', 'normal', 'fast'] as const}
            onChange={(v) => set('pacing', v)}
            labels={pacingLabels}
          />
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
            {t.directorReset ?? 'Reset to defaults'}
          </Button>
          <Button variant="gold" size="sm" onClick={onSave} disabled={saving}>
            {saving ? '…' : (t.directorSaved ?? 'Save')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
