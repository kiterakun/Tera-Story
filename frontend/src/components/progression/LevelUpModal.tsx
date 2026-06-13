import { useEffect, type FC } from 'react';
import { LevelBadge } from './LevelBadge';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Modal, ModalBody } from '../../design-system';

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
  const t = useTranslation();
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      className="max-w-sm border-gold/30"
    >
      <ModalBody className="p-8 text-center animate-scale-in">
        <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
        <p className="text-gold text-sm font-medium uppercase tracking-wider mb-2">{t.progression.levelUp}</p>
        <div className="flex justify-center mb-3">
          <LevelBadge level={newLevel} size="lg" />
        </div>
        {levelTitle && (
          <p className="text-lg font-semibold text-ink-100 mb-1">{levelTitle}</p>
        )}
        <p className="text-sm text-ink-400 mb-6">
          {t.progression.xpToNext.replace('{count}', xpRequiredForNext.toLocaleString())}
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gold text-ink-950 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
        >
          {t.progression.awesome}
        </button>
      </ModalBody>
    </Modal>
  );
};
