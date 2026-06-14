import { useCallback, useEffect, useState } from 'react';
import { useDraftStore, type CharacterDraft } from '../stores/draftStore';

export interface CharacterDraftState {
  name: string;
  description: string;
  archetype: string;
  background: string;
  personality: string;
  appearance: string;
}

export const INITIAL_CHARACTER_DRAFT: CharacterDraftState = {
  name: '',
  description: '',
  archetype: '',
  background: '',
  personality: '',
  appearance: '',
};

function draftEntryToState(entry: ReturnType<typeof useDraftStore.getState>['character']): CharacterDraftState | null {
  if (!entry) return null;
  const d = entry.data as Partial<CharacterDraftState>;
  return {
    name: d.name ?? '',
    description: d.description ?? '',
    archetype: d.archetype ?? '',
    background: d.background ?? '',
    personality: d.personality ?? '',
    appearance: d.appearance ?? '',
  };
}

export function useCharacterDraft() {
  const [state, setState] = useState<CharacterDraftState>(INITIAL_CHARACTER_DRAFT);
  const [draftResumed, setDraftResumed] = useState(false);

  const draftEntry = useDraftStore((s) => s.character);
  const setCharacterDraft = useDraftStore((s) => s.setCharacter);
  const clearCharacterDraft = useDraftStore((s) => s.clearCharacter);

  useEffect(() => {
    if (draftEntry && !draftResumed) {
      const restored = draftEntryToState(draftEntry);
      if (restored) {
        setState(restored);
        setDraftResumed(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback(() => {
    setCharacterDraft({ ...state } as CharacterDraft);
    return true;
  }, [state, setCharacterDraft]);

  const resumeDraft = useCallback(() => {
    const restored = draftEntryToState(draftEntry);
    if (restored) setState(restored);
    setDraftResumed(true);
  }, [draftEntry]);

  const discardDraft = useCallback(() => {
    clearCharacterDraft();
    setDraftResumed(false);
  }, [clearCharacterDraft]);

  return {
    state,
    setState,
    saveDraft,
    hasPersistedDraft: Boolean(draftEntry) && !draftResumed,
    resumeDraft,
    discardDraft,
  };
}
