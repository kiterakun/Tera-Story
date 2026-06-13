import React from 'react';
import { Sparkles } from 'lucide-react';
import { Spinner } from '../../design-system/Spinner';
import { useTranslation } from '../../i18n';

interface AiWorldGeneratorProps {
  prompt: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function AiWorldGenerator({
  prompt,
  onChange,
  onGenerate,
  isGenerating
}: AiWorldGeneratorProps) {
  const t = useTranslation();

  return (
    <div className="bg-gradient-to-br from-accent-600/10 to-purple-600/10 border border-accent-400/20 rounded-2xl p-6">
      <h2 className="text-lg font-display text-ink-100 mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-accent-400" />
        {t.worldCreate.aiGenerateTitle}
      </h2>
      <p className="text-xs text-ink-200/60 mb-4">
        {t.worldCreate.aiGenerateHint}
      </p>
      <textarea
        rows={3}
        className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all resize-none text-sm mb-3"
        placeholder={t.worldCreate.aiPromptPlaceholder}
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        disabled={isGenerating}
      />
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Spinner size="sm" />
            {t.worldCreate.aiGenerating}
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {t.worldCreate.aiGenerateWorld}
          </>
        )}
      </button>
    </div>
  );
}
