import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { showSuccess, showError } from '../lib/toast';
import { TERRAIN_COLORS } from '../design-system/terrain';
import {
  CreationOverlay,
  MapSelectionStep,
  WorldCreateWizard,
} from '../components/world-create';
import { useWorldDraft } from '../hooks/useWorldDraft';
import { useWorldCreateActions } from '../hooks/useWorldCreateActions';

export default function WorldCreatePage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const draft = useWorldDraft();
  const actions = useWorldCreateActions(draft.state);

  if (actions.step === 'map' || actions.step === 'creating') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-display text-ink-100">{t.worldCreate.selectSpawn}</h1>
          <p className="text-ink-200/60 mt-2 text-sm">{t.worldCreate.spawnHint}</p>
        </header>
        <MapSelectionStep
          mapData={actions.mapData}
          selectedRegionId={actions.selectedRegionId}
          onSelectRegion={actions.setSelectedRegionId}
          premise={actions.premise}
          onPremiseChange={actions.setPremise}
          onConfirm={async () => {
            const playthroughId = await actions.handleConfirmSpawn();
            if (playthroughId && actions.createdWorld) {
              navigate(`/worlds/${actions.createdWorld._id}/playthroughs/${playthroughId}`);
            }
          }}
          onSkip={() => navigate(`/worlds/${actions.createdWorld?._id}`)}
          isCreating={actions.step === 'creating'}
          createdWorld={actions.createdWorld}
          terrainColors={TERRAIN_COLORS}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      {actions.isSubmitting && <CreationOverlay label={t.worldCreate.forging} />}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display text-ink-100">{t.worldCreate.title}</h1>
        <p className="text-ink-200/60 mt-2 text-sm">{t.worldCreate.subtitle}</p>
      </header>
      <WorldCreateWizard
        state={draft.state}
        setState={draft.setState}
        aiGenerate={async () => {
          const result = await actions.handleAiGenerate();
          if (!result) return;
          draft.setState((s) => {
            const next = { ...s };
            if (result.name) next.name = result.name;
            if (result.description) next.description = result.description;
            if (result.genre) next.genre = result.genre as typeof s.genre;
            if (result.resourceTemplates?.length) next.resources = result.resourceTemplates as typeof s.resources;
            if (result.locationResourceTemplates?.length) next.locationResources = result.locationResourceTemplates as typeof s.locationResources;
            if (result.specialItemTemplates?.length) next.specialItemTemplates = result.specialItemTemplates as typeof s.specialItemTemplates;
            if (result.organizationTemplates?.length) next.organizationTemplates = result.organizationTemplates as typeof s.organizationTemplates;
            return next;
          });
        }}
        isGenerating={actions.isEnrichingWorld}
        isSubmitting={actions.isSubmitting}
        onSubmit={async () => {
          await actions.handleSubmit();
          if (actions.createdWorld && !actions.mapData) {
            navigate(`/worlds/${actions.createdWorld._id}`);
          }
        }}
        onCancel={() => navigate('/worlds')}
        onSaveDraft={() => {
          if (draft.saveDraftToLocal()) {
            showSuccess(t.toast.draftSaved ?? 'Đã lưu nháp');
          } else {
            showError(t.toast.draftSaveFailed ?? 'Không thể lưu nháp');
          }
        }}
      />
    </div>
  );
}
