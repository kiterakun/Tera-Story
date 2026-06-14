import { useCallback, useEffect, useState } from 'react';
import type { ResourceTemplate, World } from '../services/worldApi';
import type { OrganizationTemplate, SpecialItemTemplate } from '../types/entities';
import { useDraftStore, type WorldDraft } from '../stores/draftStore';

export interface WorldDraftState {
  name: string;
  description: string;
  genre: World['genre'];
  resources: ResourceTemplate[];
  locationResources: ResourceTemplate[];
  specialItemTemplates: SpecialItemTemplate[];
  organizationTemplates: OrganizationTemplate[];
  aiPrompt: string;
}

export const INITIAL_WORLD_DRAFT: WorldDraftState = {
  name: '',
  description: '',
  genre: 'fantasy',
  resources: [{ key: 'HP', type: 'progress', min: 0, max: 100, defaultValue: 100 }],
  locationResources: [{ key: 'danger_level', type: 'number', min: 0, max: 10, defaultValue: 1 }],
  specialItemTemplates: [],
  organizationTemplates: [],
  aiPrompt: '',
};

const DRAFT_FIELDS: Array<keyof WorldDraftState> = [
  'name',
  'description',
  'genre',
  'resources',
  'locationResources',
  'specialItemTemplates',
  'organizationTemplates',
  'aiPrompt',
];

function draftEntryToState(entry: ReturnType<typeof useDraftStore.getState>['world']): WorldDraftState | null {
  if (!entry) return null;
  const d = entry.data as Partial<WorldDraftState> & { step?: number };
  return {
    name: d.name ?? '',
    description: d.description ?? '',
    genre: d.genre ?? 'fantasy',
    resources: d.resources ?? INITIAL_WORLD_DRAFT.resources,
    locationResources: d.locationResources ?? INITIAL_WORLD_DRAFT.locationResources,
    specialItemTemplates: d.specialItemTemplates ?? [],
    organizationTemplates: d.organizationTemplates ?? [],
    aiPrompt: d.aiPrompt ?? '',
  };
}

export function useWorldDraft() {
  const [state, setState] = useState<WorldDraftState>(INITIAL_WORLD_DRAFT);
  const [createdWorld, setCreatedWorld] = useState<World | null>(null);
  const [mapData, setMapData] = useState<{ regions: unknown[] } | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [premise, setPremise] = useState('');
  const [draftResumed, setDraftResumed] = useState(false);

  const draftEntry = useDraftStore((s) => s.world);
  const setWorldDraft = useDraftStore((s) => s.setWorld);
  const clearWorldDraft = useDraftStore((s) => s.clearWorld);

  // On mount, offer to resume the persisted draft (consumer can call resumeDraft()).
  useEffect(() => {
    if (draftEntry && !draftResumed) {
      // auto-resume: caller can also explicitly call resumeDraft() or discardDraft().
      const restored = draftEntryToState(draftEntry);
      if (restored) {
        setState(restored);
        setDraftResumed(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraftToLocal = useCallback(() => {
    setWorldDraft({
      name: state.name,
      description: state.description,
      genre: state.genre,
      resources: state.resources,
      locationResources: state.locationResources,
      specialItemTemplates: state.specialItemTemplates,
      organizationTemplates: state.organizationTemplates,
      aiPrompt: state.aiPrompt,
    } as WorldDraft);
    return true;
  }, [state, setWorldDraft]);

  const loadDraftFromLocal = useCallback(() => {
    if (!draftEntry) return null;
    return draftEntryToState(draftEntry);
  }, [draftEntry]);

  const resumeDraft = useCallback(() => {
    const restored = loadDraftFromLocal();
    if (restored) setState(restored);
    setDraftResumed(true);
  }, [loadDraftFromLocal]);

  const discardDraft = useCallback(() => {
    clearWorldDraft();
    setDraftResumed(false);
  }, [clearWorldDraft]);

  return {
    state,
    setState,
    createdWorld,
    setCreatedWorld,
    mapData,
    setMapData,
    selectedRegionId,
    setSelectedRegionId,
    premise,
    setPremise,
    saveDraftToLocal,
    loadDraftFromLocal,
    hasPersistedDraft: Boolean(draftEntry) && !draftResumed,
    resumeDraft,
    discardDraft,
  };
}

// Re-export for consumer side-effects (mirrors hook helpers from before).
export { DRAFT_FIELDS };
