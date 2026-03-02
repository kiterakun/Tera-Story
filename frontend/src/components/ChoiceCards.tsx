import { useState } from 'react';
import { Star, ArrowRight, Sparkles, Loader2, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { showError } from '../lib/toast';
import * as supportApi from '../services/supportApi';

interface Choice {
  text: string;
  type: 'continue' | 'new_arc' | 'custom';
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

  const handleEnrichChoice = async () => {
    if (!customChoice.trim() || isEnriching) return;

    setIsEnriching(true);
    setEnrichResult(null);

    try {
      const result = await supportApi.enrichCustomChoice(playthroughId, customChoice.trim());
      setEnrichResult(result);
      // Auto-replace with enriched version
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

  return (
    <div className="mt-8 border-t border-ink-700 pt-6">
      <h3 className="font-display text-lg text-ink-100 mb-4">{t.choiceCards.whatWillYouDo}</h3>
      
      {/* AI-generated choices */}
      <div className="grid gap-3 mb-4">
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => !isGenerating && onChoiceSelect(choice.text)}
            disabled={isGenerating}
            className={`
              w-full text-left p-4 rounded-xl border transition-all duration-200
              bg-ink-800/50 border-ink-700 text-ink-100
              ${!isGenerating 
                ? 'hover:border-accent-400/40 hover:bg-ink-800 hover:shadow-lg hover:shadow-accent-400/5 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'}
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-accent-400 mt-0.5 flex-shrink-0">
                {choice.type === 'new_arc' ? <Star size={16} /> : <ArrowRight size={16} />}
              </span>
              <span className="font-serif text-base leading-relaxed">{choice.text}</span>
            </div>
          </button>
        ))}
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
            onClick={handleEnrichChoice}
            disabled={isGenerating || isEnriching || !customChoice.trim()}
            className="px-3 py-3 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title={t.choiceCards.enrichTooltip}
          >
            {isEnriching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
          {/* Go button */}
          <button
            onClick={handleSubmitChoice}
            disabled={isGenerating || !customChoice.trim()}
            className="px-5 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
          >
            {t.choiceCards.go}
          </button>
        </div>

        {/* Enrich Result Panel */}
        {enrichResult && (
          <div className="animate-fade-in space-y-3">
            {/* Warnings */}
            {enrichResult.warnings.length > 0 && (
              <div className={`p-3 rounded-xl border text-sm ${enrichResult.isValid ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    {enrichResult.warnings.map((warning, i) => (
                      <p key={i}>{warning}</p>
                    ))}
                  </div>
                  <button onClick={dismissEnrichResult} className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {enrichResult.suggestions.length > 0 && (
              <div>
                <p className="text-xs text-ink-200/50 mb-2 font-medium uppercase tracking-wider">{t.choiceCards.aiSuggestions}</p>
                <div className="space-y-1.5">
                  {enrichResult.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left p-3 rounded-xl bg-ink-800/40 border border-ink-700/50 hover:border-purple-400/30 hover:bg-ink-800/60 text-sm text-ink-200/80 hover:text-ink-100 transition-all duration-200"
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
