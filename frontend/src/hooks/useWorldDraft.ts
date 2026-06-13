import { useCallback, useState } from 'react';
import type { ResourceTemplate, World } from '../services/worldApi';
import type { OrganizationTemplate, SpecialItemTemplate } from '../types/entities';

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

export function useWorldDraft() {
  const [state, setState] = useState<WorldDraftState>(INITIAL_WORLD_DRAFT);
  const [createdWorld, setCreatedWorld] = useState<World | null>(null);
  const [mapData, setMapData] = useState<{ regions: unknown[] } | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [premise, setPremise] = useState('');

  const saveDraftToLocal = useCallback(() => {
    try {
      window.localStorage.setItem('worldDraft', JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }, [state]);

  const loadDraftFromLocal = useCallback(() => {
    try {
      const raw = window.localStorage.getItem('worldDraft');
      if (!raw) return null;
      return JSON.parse(raw) as WorldDraftState;
    } catch {
      return null;
    }
  }, []);

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
  };
}
