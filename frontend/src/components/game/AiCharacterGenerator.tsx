import { useState } from 'react';
import { Sparkles, Wand2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Spinner } from '../../design-system/Spinner';
import { cn } from '../../design-system/cn';

const ROLE_CHIPS = ['protagonist', 'mentor', 'trickster', 'rival', 'guardian'] as const;
const TONE_CHIPS = ['stoic', 'cheerful', 'brooding', 'curious', 'flippant'] as const;

const INSPIRATION_PROMPTS = [
  'A reclusive cartographer who has mapped every road but never left home.',
  'A retired general trying to redeem one last lost soul.',
  'A guild orphan with a sharper wit than any blade.',
  'A child prophet whose visions terrify the elders.',
  'A disgraced scholar chasing a heresy they secretly believe.',
  'A traveling musician who carries an impossible song.',
  'A bounty hunter who only accepts contracts the law forgot.',
  'A healer who treats souls, not bodies.',
  'A disgraced noble plotting quietly from exile.',
  'A lighthouse keeper who sees the future in fog.',
];

interface AiCharacterGeneratorProps {
  prompt: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  previewName?: string;
  previewRole?: string;
  previewDescription?: string;
}

export function AiCharacterGenerator({
  prompt,
  onChange,
  onGenerate,
  isGenerating,
  errorMessage,
  onClearError,
  previewName,
  previewRole,
  previewDescription,
}: AiCharacterGeneratorProps) {
  const t = useTranslation();
  const [selectedRoles, setSelectedRoles] = useState<Array<(typeof ROLE_CHIPS)[number]>>([]);
  const [selectedTones, setSelectedTones] = useState<Array<(typeof TONE_CHIPS)[number]>>([]);

  const toggle = <T extends string>(value: T, list: T[], setter: (next: T[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-accent-600/15 via-purple-600/5 to-transparent border border-accent-500/20 rounded-2xl p-6 sm:p-7 shadow-lg shadow-accent-600/5 group hover:border-accent-500/30 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-600/10 rounded-full blur-3xl group-hover:bg-accent-600/15 transition-all duration-500 -mr-6 -mt-6" aria-hidden="true" />

      <div className="relative z-10">
        <h2 className="text-lg font-display font-semibold text-ink-100 mb-2 flex items-center gap-2.5">
          <Sparkles size={18} className="text-accent-400 animate-pulse" aria-hidden="true" />
          {t.characterCreate.aiGenerateTitle}
        </h2>
        <p className="text-xs text-ink-200/60 leading-relaxed mb-4 font-serif">
          {t.characterCreate.aiGenerateHint}
        </p>

        <label htmlFor="ai-character-prompt" className="sr-only">
          {t.characterCreate.aiGenerateTitle}
        </label>
        <textarea
          id="ai-character-prompt"
          rows={3}
          className="w-full bg-ink-950/80 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all duration-300 resize-none font-serif text-sm mb-3.5"
          placeholder={t.characterCreate.aiPromptPlaceholder}
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          disabled={isGenerating}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <fieldset>
            <legend className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Role</legend>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Role chips">
              {ROLE_CHIPS.map((role) => {
                const active = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggle(role, selectedRoles, setSelectedRoles)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                      active
                        ? 'bg-accent-500/20 text-accent-200 border-accent-500/40'
                        : 'bg-ink-950/50 text-ink-200/60 border-ink-700 hover:border-ink-600',
                    )}
                    aria-pressed={active}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Tone</legend>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tone chips">
              {TONE_CHIPS.map((tone) => {
                const active = selectedTones.includes(tone);
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => toggle(tone, selectedTones, setSelectedTones)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                      active
                        ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                        : 'bg-ink-950/50 text-ink-200/60 border-ink-700 hover:border-ink-600',
                    )}
                    aria-pressed={active}
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-accent-600 hover:bg-accent-500 disabled:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg hover:shadow-accent-600/25 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" className="text-white/80" />
                <span>{t.characterCreate.aiGenerating}</span>
              </>
            ) : (
              <>
                <Wand2 size={16} className="text-white/90 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
                <span>{t.characterCreate.aiGenerateCharacter}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onChange(INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)]!)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-ink-200 hover:text-ink-100 border border-ink-700 hover:border-ink-600 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {t.characterCreate.inspireMe ?? 'Inspire me'}
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 p-3 rounded-xl border border-danger/30 bg-danger/10 text-danger"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1 text-sm">{errorMessage}</div>
            {onClearError && (
              <button
                type="button"
                onClick={onClearError}
                className="inline-flex items-center gap-1 text-danger/80 hover:text-danger text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md px-2 py-1"
                aria-label={t.common.retry ?? 'Retry'}
                data-testid="ai-retry-button"
              >
                <RefreshCw size={12} aria-hidden="true" />
                {t.common.retry ?? 'Retry'}
              </button>
            )}
          </div>
        )}

        {(previewName || previewDescription) && !isGenerating && (
          <div
            className="mt-3 p-3 rounded-xl border border-accent-500/30 bg-ink-950/60"
            data-testid="ai-character-preview"
            aria-live="polite"
          >
            <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Live preview</p>
            {previewName && <p className="text-sm font-display text-ink-100">{previewName}</p>}
            {previewRole && <p className="text-xs text-accent-300 capitalize">{previewRole}</p>}
            {previewDescription && <p className="text-xs text-ink-200/60 mt-1 line-clamp-3">{previewDescription}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
