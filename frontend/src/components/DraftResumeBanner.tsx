/**
 * DraftResumeBanner — small inline banner offering to resume or discard
 * a persisted draft. Used by WorldCreatePage and CharacterCreatePage.
 *
 * Renders nothing when `hasPersistedDraft` is false, so it's safe to
 * mount unconditionally in the page header.
 */

import { useTranslation } from '../i18n';
import { Button } from '../design-system';

export interface DraftResumeBannerProps {
  hasPersistedDraft: boolean;
  onResume: () => void;
  onDiscard: () => void;
}

export function DraftResumeBanner({ hasPersistedDraft, onResume, onDiscard }: DraftResumeBannerProps) {
  const t = useTranslation();
  if (!hasPersistedDraft) return null;

  return (
    <div
      className="mb-4 flex flex-col items-start gap-3 rounded-2xl border border-gold-400/30 bg-gold-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
      aria-live="polite"
    >
      <div>
        <p className="font-display text-base text-ink-100">
          {t.layout?.autosaveTitle ?? 'Autosaved draft'}
        </p>
        <p className="text-sm text-ink-200/75">
          {t.layout?.autosaveBody ?? 'We saved your progress. Would you like to resume where you left off?'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          className="text-ink-200 hover:text-ink-100"
        >
          {t.layout?.autosaveDiscard ?? 'Discard'}
        </Button>
        <Button variant="gold" size="sm" onClick={onResume}>
          {t.layout?.autosaveResume ?? 'Resume draft'}
        </Button>
      </div>
    </div>
  );
}
