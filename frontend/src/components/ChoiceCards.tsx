import { useState } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Choice {
  text: string;
  type: 'continue' | 'new_arc' | 'custom';
}

interface ChoiceCardsProps {
  choices: Choice[];
  isGenerating: boolean;
  onChoiceSelect: (choice: string) => void;
}

export function ChoiceCards({ choices, isGenerating, onChoiceSelect }: ChoiceCardsProps) {
  const t = useTranslation();
  const [customChoice, setCustomChoice] = useState('');

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
      <div className="flex gap-2">
        <input
          type="text"
          value={customChoice}
          onChange={e => setCustomChoice(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && customChoice.trim() && !isGenerating && onChoiceSelect(customChoice)}
          placeholder={t.choiceCards.customPlaceholder}
          disabled={isGenerating}
          className="flex-1 bg-ink-950 border border-ink-700 text-ink-100 p-3 rounded-xl focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none placeholder:text-ink-500 disabled:opacity-50 text-sm transition-all"
        />
        <button
          onClick={() => customChoice.trim() && !isGenerating && onChoiceSelect(customChoice)}
          disabled={isGenerating || !customChoice.trim()}
          className="px-5 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
        >
          {t.choiceCards.go}
        </button>
      </div>
    </div>
  );
}
