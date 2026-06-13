import { useCallback, useState } from 'react';
import { useWorldStore } from '../stores/worldStore';
import { useTranslation } from '../i18n';
import { showSuccess, showError } from '../lib/toast';
import type { MapData, World } from '../services/worldApi';
import * as supportApi from '../services/supportApi';
import { api } from '../services/api';
import type { WorldDraftState } from './useWorldDraft';

export type FlowStep = 'form' | 'map' | 'creating';

export function useWorldCreateActions(draft: WorldDraftState) {
  const t = useTranslation();
  const { createWorld } = useWorldStore();
  const [step, setStep] = useState<FlowStep>('form');
  const [createdWorld, setCreatedWorld] = useState<World | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrichingWorld, setIsEnrichingWorld] = useState(false);
  const [premise, setPremise] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const handleAiGenerate = useCallback(async () => {
    if (!draft.aiPrompt.trim()) return;
    setIsEnrichingWorld(true);
    try {
      const result = await supportApi.enrichWorld(draft.aiPrompt.trim());
      // Returns from the API; merge into a fresh draft copy returned
      // to the caller via callback so the wizard can update its state.
      // (Implementation lives in WorldCreatePage which threads the
      // updated state back into useWorldDraft.)
      return result;
    } catch (err) {
      console.error('AI world generation failed:', err);
      showError(t.toast.aiWorldGenFailed);
      return null;
    } finally {
      setIsEnrichingWorld(false);
    }
  }, [draft.aiPrompt, t.toast.aiWorldGenFailed]);

  const handleSubmit = useCallback(async () => {
    if (!draft.name.trim()) return;
    setIsSubmitting(true);
    try {
      const { world: newWorld, mapData: returnedMapData } = await createWorld({
        name: draft.name,
        description: draft.description,
        genre: draft.genre,
        resourceTemplates: draft.resources,
        locationResourceTemplates: draft.locationResources.filter((r) => r.key.trim()),
        specialItemTemplates: draft.specialItemTemplates.filter((t) => t.category.trim()),
        organizationTemplates: draft.organizationTemplates.filter((t) => t.type.trim()),
      });
      showSuccess(t.toast.worldCreated);
      if (returnedMapData && returnedMapData.regions && returnedMapData.regions.length > 0) {
        setCreatedWorld(newWorld);
        setMapData(returnedMapData);
        setStep('map');
      } else {
        setCreatedWorld(newWorld);
        // Caller is responsible for navigation
      }
    } catch (error) {
      console.error('Failed to create world:', error);
      showError(t.toast.worldCreateFailed);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, createWorld, t.toast.worldCreated, t.toast.worldCreateFailed]);

  const handleConfirmSpawn = useCallback(async () => {
    if (!createdWorld || !selectedRegionId) return;
    setIsSubmitting(true);
    setStep('creating');
    try {
      const { data } = await api.post(`/worlds/${createdWorld._id}/playthroughs`, {
        name: `${createdWorld.name} - Journey`,
        spawnRegionId: selectedRegionId,
        premise: premise.trim() || undefined,
      });
      showSuccess(t.toast.playthroughCreated);
      return data.playthrough._id as string;
    } catch (error) {
      console.error('Failed to create playthrough:', error);
      showError(t.toast.playthroughCreateFailed);
      setStep('map');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [createdWorld, selectedRegionId, premise, t.toast.playthroughCreated, t.toast.playthroughCreateFailed]);

  return {
    step,
    setStep,
    createdWorld,
    setCreatedWorld,
    mapData,
    setMapData,
    isSubmitting,
    isEnrichingWorld,
    premise,
    setPremise,
    selectedRegionId,
    setSelectedRegionId,
    handleAiGenerate,
    handleSubmit,
    handleConfirmSpawn,
  };
}
