import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { Spinner } from '../../design-system/Spinner';
import { useTranslation } from '../../i18n';
import { cn } from '../../design-system/cn';

const TONE_CHIPS = ['dark', 'hopeful', 'epic', 'gritty', 'mysterious'] as const;

const INSPIRATION_PROMPTS = [
  'A floating archipelago of sky-pirates where storms speak prophecy.',
  'A necromancer academy built atop an ancient slumbering god.',
  'Borderlands between a crystalline city and a fungal underdark.',
  'A frozen monastery where monks bind demons into their own memories.',
  'Coastal city ruled by three noble houses, each wielding a gemstone of power.',
  'A desert empire where a forgotten river god resurfaces once a century.',
  'A moonlit archipelago of ghost-light markets and shadow-coin currency.',
  'An endless library that grows new wings each time a reader dreams.',
  'A magic-tech metropolis where the poor barter years of life for power.',
  'A dragon-tribal realm where succession is decided by riddles, not war.',
  'A bio-luminescent jungle with sentient moss that records every secret.',
  'A clockwork city winding down, its gears turning only via dying wish energy.',
];

interface AiWorldGeneratorProps {
  prompt: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  tones?: ReadonlyArray<(typeof TONE_CHIPS)[number]>;
  selectedTones?: ReadonlyArray<(typeof TONE_CHIPS)[number]>;
  onToneToggle?: (tone: (typeof TONE_CHIPS)[number]) => void;
  previewName?: string;
  previewDescription?: string;
  previewGenre?: string;
}

export function AiWorldGenerator({
  prompt,
  onChange,
  onGenerate,
  isGenerating,
  errorMessage,
  onClearError,
  tones = TONE_CHIPS,
  selectedTones = [],
  onToneToggle,
  previewName,
  previewDescription,
  previewGenre,
}: AiWorldGeneratorProps) {
  const t = useTranslation();

  
  const handleInspire = () => {
    const pick = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)]!;
    onChange(pick);
  };

  return (
    <div className="bg-gradient-to-br from-accent-600/10 to-purple-600/10 border border-accent-400/20 rounded-2xl p-6">
      <h2 className="text-lg font-display text-ink-100 mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-accent-400" aria-hidden="true" />
        {t.worldCreate.aiGenerateTitle}
      </h2>
      <p className="text-xs text-ink-200/60 mb-4">{t.worldCreate.aiGenerateHint}</p>

      <label htmlFor="ai-world-prompt" className="sr-only">
        {t.worldCreate.aiGenerateTitle}
      </label>
      <textarea
        id="ai-world-prompt"
        rows={3}
        className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all resize-none text-sm mb-3"
        placeholder={t.worldCreate.aiPromptPlaceholder}
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        disabled={isGenerating}
      />

      {onToneToggle && (
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={t.worldCreate.aiTones}>
          {tones.map((tone) => {
            const active = selectedTones.includes(tone);
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onToneToggle(tone)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                  active
                    ? 'bg-accent-500/20 text-accent-200 border-accent-500/40'
                    : 'bg-ink-950/50 text-ink-200/60 border-ink-700 hover:border-ink-600',
                )}
                aria-pressed={active}
              >
                {tone}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" />
              {t.worldCreate.aiGenerating}
            </>
          ) : (
            <>
              <Sparkles size={16} aria-hidden="true" />
              {t.worldCreate.aiGenerateWorld}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleInspire}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-ink-200 hover:text-ink-100 border border-ink-700 hover:border-ink-600 rounded-xl text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          {t.worldCreate.inspireMe ?? 'Inspire me'}
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
          data-testid="ai-world-preview"
          aria-live="polite"
        >
          <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">
            {t.worldCreate.aiPreview ?? 'Live preview'}
          </p>
          {previewName && (
            <p className="text-sm font-display text-ink-100">{previewName}</p>
          )}
          {previewGenre && (
            <p className="text-xs text-accent-300 capitalize">{previewGenre}</p>
          )}
          {previewDescription && (
            <p className="text-xs text-ink-200/60 mt-1 line-clamp-3">{previewDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}
