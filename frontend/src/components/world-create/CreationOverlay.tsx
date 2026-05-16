import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface CreationOverlayProps {
  label: string;
}

export function CreationOverlay({ label }: CreationOverlayProps) {
  const t = useTranslation();

  return (
    <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-accent-500/20 blur-3xl rounded-full" />
          <Loader2 size={64} className="animate-spin text-accent-400 mx-auto relative z-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-display text-ink-100">{label}</h3>
          <p className="text-ink-200/60 text-sm">{t.worldCreate.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
