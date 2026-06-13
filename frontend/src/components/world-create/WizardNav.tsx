import type { ReactNode } from 'react';
import { useTranslation } from '../../i18n';

interface WizardNavProps {
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  isFinalStep?: boolean;
  children?: ReactNode;
}

export function WizardNav({
  onBack,
  onNext,
  onSaveDraft,
  isNextDisabled = false,
  isSubmitting = false,
  submitLabel,
  isFinalStep = false,
  children,
}: WizardNavProps) {
  const t = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 text-ink-200 hover:text-ink-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-lg"
          >
            {t.worldCreate.back ?? 'Quay lại'}
          </button>
        )}
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-4 py-2.5 text-ink-200 hover:text-ink-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-lg"
          >
            {t.worldCreate.saveDraft ?? 'Lưu nháp'}
          </button>
        )}
        {children}
      </div>
      <div className="flex items-center gap-3">
        {onNext && !isFinalStep && (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting}
            className="px-6 py-2.5 bg-ink-800 hover:bg-ink-700 text-ink-100 rounded-xl border border-ink-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {t.worldCreate.next ?? 'Tiếp tục'}
          </button>
        )}
        {onNext && isFinalStep && (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting}
            className="px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg hover:shadow-accent-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {submitLabel ?? t.worldCreate.createWorld}
          </button>
        )}
      </div>
    </div>
  );
}
