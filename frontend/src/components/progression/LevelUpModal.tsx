import { useEffect, type FC } from 'react';
import { LevelBadge } from './LevelBadge';
import { Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  levelTitle?: string;
  xpRequiredForNext: number;
  onClose: () => void;
}

export const LevelUpModal: FC<LevelUpModalProps> = ({
  isOpen,
  newLevel,
  levelTitle,
  xpRequiredForNext,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/80 animate-[fadeIn_0.3s_ease-out]" onClick={onClose} />
      <div className="relative bg-ink-900 border border-gold/30 rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-[scaleIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
        <p className="text-gold text-sm font-medium uppercase tracking-wider mb-2">Level Up!</p>
        <div className="flex justify-center mb-3">
          <LevelBadge level={newLevel} size="lg" />
        </div>
        {levelTitle && (
          <p className="text-lg font-semibold text-ink-100 mb-1">{levelTitle}</p>
        )}
        <p className="text-sm text-ink-400 mb-6">
          {xpRequiredForNext.toLocaleString()} XP to next level
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gold text-ink-950 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};
