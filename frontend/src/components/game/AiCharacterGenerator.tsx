import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface AiCharacterGeneratorProps {
  prompt: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function AiCharacterGenerator({
  prompt,
  onChange,
  onGenerate,
  isGenerating
}: AiCharacterGeneratorProps) {
  const t = useTranslation();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-accent-600/15 via-purple-600/5 to-transparent border border-accent-500/20 rounded-2xl p-6 sm:p-7 shadow-lg shadow-accent-600/5 group hover:border-accent-500/30 transition-all duration-300">
      {/* Decorative ambient light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-600/10 rounded-full blur-3xl group-hover:bg-accent-600/15 transition-all duration-500 -mr-6 -mt-6" />
      
      <div className="relative z-10">
        <h2 className="text-lg font-display font-semibold text-ink-100 mb-2 flex items-center gap-2.5">
          <Sparkles size={18} className="text-accent-400 animate-pulse" />
          {t.characterCreate.aiGenerateTitle}
        </h2>
        <p className="text-xs text-ink-200/60 leading-relaxed mb-4 font-serif">
          {t.characterCreate.aiGenerateHint}
        </p>
        
        <div className="relative">
          <textarea
            rows={3}
            className="w-full bg-ink-950/80 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all duration-300 resize-none font-serif text-sm mb-3.5"
            placeholder={t.characterCreate.aiPromptPlaceholder}
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-accent-600 hover:bg-accent-500 disabled:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg hover:shadow-accent-600/25 active:scale-98"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin text-white/80" />
              <span>{t.characterCreate.aiGenerating}</span>
            </>
          ) : (
            <>
              <Wand2 size={16} className="text-white/90 group-hover:rotate-12 transition-transform duration-300" />
              <span>{t.characterCreate.aiGenerateCharacter}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
