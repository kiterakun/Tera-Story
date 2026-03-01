import React, { useState } from 'react';

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
  const [customChoice, setCustomChoice] = useState('');

  return (
    <div className="mt-8 border-t border-ink-700 pt-6">
      <h3 className="font-display text-lg text-parchment-50 mb-4">What will you do?</h3>
      
      {/* AI-generated choices */}
      <div className="grid gap-3 mb-4">
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => !isGenerating && onChoiceSelect(choice.text)}
            disabled={isGenerating}
            className={`
              w-full text-left p-4 rounded-lg border transition-all duration-200
              bg-ink-800/50 border-ink-700 text-parchment-50
              ${!isGenerating ? 'hover:border-accent-400 hover:bg-ink-700/70 hover:shadow-[0_0_15px_rgba(129,140,248,0.2)] cursor-pointer' : 'opacity-50 cursor-not-allowed'}
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-accent-400 mt-0.5 flex-shrink-0">
                {choice.type === 'new_arc' ? '⭐' : '→'}
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
          placeholder="Or write your own choice..."
          disabled={isGenerating}
          className="flex-1 bg-ink-900 border border-ink-700 text-parchment-50 p-3 rounded-lg focus:border-accent-400 outline-none placeholder:text-ink-200 disabled:opacity-50"
        />
        <button
          onClick={() => customChoice.trim() && !isGenerating && onChoiceSelect(customChoice)}
          disabled={isGenerating || !customChoice.trim()}
          className="px-4 py-3 bg-accent-600 hover:bg-accent-400 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Go
        </button>
      </div>
    </div>
  );
}
