import { Spinner } from '../../design-system/Spinner';
import { Modal, ModalBody, ModalFooter } from '../../design-system';
import type { PeekResponse } from '../../services/fateThreadsApi';
import { useTranslation } from '../../i18n';

interface PeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  peekResult: PeekResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function PeekModal({
  isOpen,
  onClose,
  onContinue,
  peekResult,
  isLoading,
  error,
}: PeekModalProps) {
  const t = useTranslation();

  return (
    <Modal open={isOpen} onClose={onClose} title={t.fateThreads.peekTitle} size="md">
      <ModalBody>
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner size="lg" className="w-8 h-8 text-gold-400" />
            <p className="text-sm text-ink-400">
              {t.fateThreads.peekLoading}
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="py-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {peekResult && !isLoading && (
          <div className="transition-opacity duration-300">
            <p className="text-sm leading-relaxed text-narration whitespace-pre-line">
              {peekResult.alternateDescription}
            </p>
            {peekResult.choiceText && (
              <p className="mt-3 text-xs text-ink-500 italic">
                {t.fateThreads.peekChoicePrefix.replace('{text}', peekResult.choiceText)}
              </p>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-ink-600 text-ink-300 hover:bg-ink-800 transition-colors text-sm"
        >
          {t.fateThreads.close}
        </button>
        <button
          onClick={onContinue}
          className="px-4 py-2 rounded-lg bg-gold-500 text-ink-950 font-semibold hover:bg-gold-500/80 transition-colors text-sm"
        >
          {t.fateThreads.continueReading}
        </button>
      </ModalFooter>
    </Modal>
  );
}
