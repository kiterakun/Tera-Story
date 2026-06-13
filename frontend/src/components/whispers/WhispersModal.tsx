import type { FC } from 'react';
import type { WhisperItem } from '../../hooks/useWhispers';
import { Users, Mail, BookOpen, Newspaper } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../design-system';

interface WhispersModalProps {
  isOpen: boolean;
  whispers: WhisperItem[];
  daysAway: number;
  onClose: () => void;
  onContinue: () => void;
  isLoading?: boolean;
}

const whisperIcons: Record<string, typeof Users> = {
  rumor: Users,
  letter: Mail,
  diary: BookOpen,
  news: Newspaper,
};

export const WhispersModal: FC<WhispersModalProps> = ({
  isOpen,
  whispers,
  daysAway,
  onClose,
  onContinue,
  isLoading = false,
}) => {
  const t = useTranslation();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="md"
      className="rounded-2xl max-h-[80vh]"
    >
      <ModalHeader className="sticky top-0 bg-ink-900 border-b border-ink-800 p-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-100">{t.whispers.title}</h2>
          <p className="text-sm text-ink-400">
            {(daysAway === 1
              ? t.whispers.daysPassed
              : (t.whispers.daysPassed_plural || t.whispers.daysPassed)
            ).replace('{count}', String(daysAway))}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="p-4 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-ink-800 rounded-lg p-4">
              <div className="h-3 bg-ink-700 rounded w-1/4 mb-2" />
              <div className="h-4 bg-ink-700 rounded w-full" />
            </div>
          ))
        ) : whispers.length === 0 ? (
          <p className="text-center text-ink-500 py-8">{t.whispers.empty}</p>
        ) : (
          whispers.map((w, i) => {
            const Icon = whisperIcons[w.type] ?? BookOpen;
            return (
              <div
                key={i}
                className="bg-ink-800/50 border border-ink-700/50 rounded-lg p-4 animate-[fadeIn_0.5s_ease-out]"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gold shrink-0" />
                  <span className="text-xs font-medium text-gold uppercase tracking-wide">
                    {t.whispers.types[w.type as keyof typeof t.whispers.types]}
                  </span>
                </div>
                <p className="text-sm text-ink-200 leading-relaxed">{w.content}</p>
                {w.attribution && (
                  <p className="text-xs text-ink-500 mt-1">— {w.attribution}</p>
                )}
              </div>
            );
          })
        )}
      </ModalBody>

      <ModalFooter className="sticky bottom-0 bg-ink-900 border-t border-ink-800 p-4">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm text-ink-400 hover:text-ink-200 border border-ink-700 rounded-lg transition-colors"
        >
          {t.whispers.skip}
        </button>
        <button
          onClick={onContinue}
          className="flex-1 px-4 py-2 text-sm bg-gold text-ink-950 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
        >
          {t.whispers.continue}
        </button>
      </ModalFooter>
    </Modal>
  );
};
