import { useRef, useState, type KeyboardEvent } from 'react';
import { Star, ArrowRight, Sparkles, AlertTriangle, X } from 'lucide-react';
import { Spinner } from '../design-system/Spinner';
import { cn } from '../design-system';
import { useTranslation } from '../i18n';
import { showError } from '../lib/toast';
import * as supportApi from '../services/supportApi';

interface Choice {
  text: string;
  type: 'continue' | 'new_arc' | 'custom';
  /** Optional impact preview shown beneath the choice text. */
  impact?: string;
  /** Optional travel hint when the choice leads to a new location. */
  travelHint?: string;
}

interface ChoiceCardsProps {
  choices: Choice[];
  isGenerating: boolean;
  playthroughId: string;
  onChoiceSelect: (choice: string) => void;
}

interface EnrichResult {
  enrichedChoice: string;
  warnings: string[];
  isValid: boolean;
  suggestions: string[];
}

export function ChoiceCards({ choices, isGenerating, playthroughId, onChoiceSelect }: ChoiceCardsProps) {
  const t = useTranslation();
  const [customChoice, setCustomChoice] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<EnrichResult | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleEnrichChoice = async () => {
    if (!customChoice.trim() || isEnriching) return;

    setIsEnriching(true);
    setEnrichResult(null);

    try {
      const result = await supportApi.enrichCustomChoice(playthroughId, customChoice.trim());
      setEnrichResult(result);
      if (result.enrichedChoice) {
        setCustomChoice(result.enrichedChoice);
      }
    } catch (err) {
      console.error('Enrich choice failed:', err);
      showError(t.toast.aiEnrichFailed);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSubmitChoice = () => {
    if (!customChoice.trim() || isGenerating) return;
    onChoiceSelect(customChoice);
    setCustomChoice('');
    setEnrichResult(null);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setCustomChoice(suggestion);
    setEnrichResult(null);
  };

  const dismissEnrichResult = () => {
    setEnrichResult(null);
  };

  /** Keyboard navigation within choice radiogroup. */
  const handleChoiceKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const count = choices.length;
    if (count === 0) return;
    let next = focusedIndex;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        next = (focusedIndex + 1) % count;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        next = (focusedIndex - 1 + count) % count;
        break;
      case 'Home':
        e.preventDefault();
        next = 0;
        break;
      case 'End':
        e.preventDefault();
        next = count - 1;
        break;
      default:
        return;
    }
    setFocusedIndex(next);
    buttonRefs.current[next]?.focus();
  };

  return (
    <div
      className="mt-8 border-t border-ink-700 pt-6"
      role="radiogroup"
      aria-label={t.choiceCards.whatWillYouDo}
    >
      <h3 className="font-display text-lg text-ink-100 mb-4">
        {t.choiceCards.whatWillYouDo}
      </h3>

      {/* AI-generated choices */}
      <div className="grid gap-3 mb-4">
        {choices.map((choice, i) => {
          const Icon = choice.type === 'new_arc' ? Star : ArrowRight;
          const isFocused = focusedIndex === i;
          return (
            <button
              key={i}
              ref={(el) => { buttonRefs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={isFocused}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => !isGenerating && onChoiceSelect(choice.text)}
              onFocus={() => setFocusedIndex(i)}
              onKeyDown={handleChoiceKey}
              disabled={isGenerating}
              className={cn(
                'group relative w-full text-left rounded-xl border',
                'min-h-[88px] p-4',
                'transition-all duration-base ease-standard',
                'bg-ink-800/50 border-ink-700 text-ink-100',
                'active:scale-[0.98]',
                !isGenerating && [
                  'hover:border-accent-400/40 hover:bg-ink-800',
                  'hover:shadow-lg hover:shadow-accent-400/5',
                  'cursor-pointer',
                ],
                isFocused && [
                  'ring-2 ring-accent-500 ring-offset-2 ring-offset-ink-950',
                  'border-accent-500/50',
                ],
                isGenerating && 'opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn(
                  'mt-0.5 shrink-0 transition-colors duration-base',
                  isFocused ? 'text-accent-300' : 'text-accent-400',
                )}>
                  <Icon size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-serif text-base leading-relaxed block">
                    {choice.text}
                  </span>
                  {choice.impact && (
                    <span className="block mt-1 text-xs text-ink-200/60 italic">
                      {choice.impact}
                    </span>
                  )}
                  {choice.travelHint && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-accent-400/80">
                      <ArrowRight size={12} />
                      {choice.travelHint}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom choice input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={customChoice}
            onChange={e => { setCustomChoice(e.target.value); setEnrichResult(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmitChoice()}
            placeholder={t.choiceCards.customPlaceholder}
            disabled={isGenerating || isEnriching}
            className="flex-1 bg-ink-950 border border-ink-700 text-ink-100 p-3 rounded-xl focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none placeholder:text-ink-500 disabled:opacity-50 text-sm transition-all"
          />
          {/* AI Enrich button */}
          <button
            type="button"
            onClick={handleEnrichChoice}
            disabled={isGenerating || isEnriching || !customChoice.trim()}
            aria-label={t.choiceCards.enrichTooltip}
            className="px-3 py-3 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl transition-all duration-base ease-standard disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isEnriching ? <Spinner size="sm" /> : <Sparkles size={16} />}
          </button>
          {/* Go button */}
          <button
            type="button"
            onClick={handleSubmitChoice}
            disabled={isGenerating || !customChoice.trim()}
            className="px-5 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-base ease-standard disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
          >
            {t.choiceCards.go}
          </button>
        </div>

        {/* Enrich Result Panel */}
        {enrichResult && (
          <div className="animate-fade-in space-y-3">
            {/* Warnings */}
            {enrichResult.warnings.length > 0 && (
              <div
                className={cn(
                  'p-3 rounded-xl border text-sm',
                  enrichResult.isValid
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300',
                )}
                role={enrichResult.isValid ? 'status' : 'alert'}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    {enrichResult.warnings.map((warning, i) => (
                      <p key={i}>{warning}</p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={dismissEnrichResult}
                    aria-label="Dismiss warnings"
                    className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {enrichResult.suggestions.length > 0 && (
              <div>
                <p className="text-xs text-ink-200/50 mb-2 font-medium uppercase tracking-wider">
                  {t.choiceCards.aiSuggestions}
                </p>
                <div className="space-y-1.5">
                  {enrichResult.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left p-3 rounded-xl bg-ink-800/40 border border-ink-700/50 hover:border-purple-400/30 hover:bg-ink-800/60 text-sm text-ink-200/80 hover:text-ink-100 transition-all duration-base ease-standard"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles size={14} className="text-purple-400/60 mt-0.5 shrink-0" />
                        <span className="font-serif">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
