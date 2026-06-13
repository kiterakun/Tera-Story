/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from '../../i18n';
import { BasicInfoStep } from './BasicInfoStep';
import { ResourceTemplatesStep } from './ResourceTemplatesStep';
import { SpecialItemTemplatesStep } from './SpecialItemTemplatesStep';
import { OrganizationTemplatesStep } from './OrganizationTemplatesStep';
import { WizardProgress, type WizardStepId } from './WizardProgress';
import { WizardNav } from './WizardNav';
import { WizardSummary } from './WizardSummary';
import type { ResourceTemplate, World } from '../../services/worldApi';
import type { OrganizationTemplate, SpecialItemTemplate } from '../../types/entities';

export const STEPS: { id: WizardStepId; labelKey: string }[] = [
  { id: 'basic', labelKey: 'basicInfoStep' },
  { id: 'map', labelKey: 'mapStep' },
  { id: 'resources', labelKey: 'resourceTemplatesStep' },
  { id: 'special-items', labelKey: 'specialItemsStep' },
  { id: 'organizations', labelKey: 'organizationsStep' },
];

export interface WizardFormState {
  name: string;
  description: string;
  genre: World['genre'];
  resources: ResourceTemplate[];
  locationResources: ResourceTemplate[];
  specialItemTemplates: SpecialItemTemplate[];
  organizationTemplates: OrganizationTemplate[];
  aiPrompt: string;
}

interface WorldCreateWizardProps {
  state: WizardFormState;
  setState: Dispatch<SetStateAction<WizardFormState>>;
  aiGenerate: () => void;
  isGenerating: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
}

export function WorldCreateWizard({
  state,
  setState,
  aiGenerate,
  isGenerating,
  isSubmitting,
  onSubmit,
  onCancel,
  onSaveDraft,
}: WorldCreateWizardProps) {
  const t = useTranslation();
  const [activeStep, setActiveStep] = useState<WizardStepId>('basic');
  const [completed, setCompleted] = useState<Set<WizardStepId>>(new Set());

  const stepLabels: Record<WizardStepId, string> = {
    basic: t.worldCreate.basicInfoStep ?? 'Cơ bản',
    map: t.worldCreate.mapStep ?? 'Bản đồ',
    resources: t.worldCreate.resourceTemplatesStep ?? 'Chỉ số',
    'special-items': t.worldCreate.specialItemsStep ?? 'Vật phẩm đặc biệt',
    organizations: t.worldCreate.organizationsStep ?? 'Tổ chức',
  };

  const steps = STEPS.map((s) => ({ id: s.id, label: stepLabels[s.id] }));

  const currentIdx = STEPS.findIndex((s) => s.id === activeStep);
  const isFinalStep = currentIdx === STEPS.length - 1;
  const isFirstStep = currentIdx === 0;

  const goToStep = (step: WizardStepId) => {
    if (step === activeStep) return;
    if (completed.has(step) || step === activeStep) {
      setActiveStep(step);
    }
  };

  const handleNext = () => {
    if (isFinalStep) {
      onSubmit();
      return;
    }
    setCompleted((prev) => new Set(prev).add(activeStep));
    const nextStep = STEPS[currentIdx + 1];
    if (nextStep) setActiveStep(nextStep.id);
  };

  const handleBack = () => {
    if (isFirstStep) return;
    const prev = STEPS[currentIdx - 1];
    if (prev) setActiveStep(prev.id);
  };

  const basicValid = state.name.trim().length > 0;
  const resourcesValid = state.resources.length > 0;
  const canSubmit = basicValid && resourcesValid;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <WizardProgress steps={steps} currentStep={activeStep} completed={completed} onStepClick={goToStep} />

        {activeStep === 'basic' && (
          <BasicInfoStep
            name={state.name}
            setName={(v) => setState((s) => ({ ...s, name: typeof v === 'function' ? v(s.name) : v }))}
            description={state.description}
            setDescription={(v) =>
              setState((s) => ({ ...s, description: typeof v === 'function' ? v(s.description) : v }))
            }
            genre={state.genre}
            setGenre={(v) => setState((s) => ({ ...s, genre: typeof v === 'function' ? v(s.genre) : v }))}
            aiPrompt={state.aiPrompt}
            setAiPrompt={(v) => setState((s) => ({ ...s, aiPrompt: typeof v === 'function' ? v(s.aiPrompt) : v }))}
            onAiGenerate={aiGenerate}
            isGenerating={isGenerating}
          />
        )}

        {activeStep === 'resources' && (
          <ResourceTemplatesStep
            resources={state.resources}
            setResources={(v) =>
              setState((s) => ({ ...s, resources: typeof v === 'function' ? v(s.resources) : v }))
            }
            locationResources={state.locationResources}
            setLocationResources={(v) =>
              setState((s) => ({ ...s, locationResources: typeof v === 'function' ? v(s.locationResources) : v }))
            }
          />
        )}

        {activeStep === 'special-items' && (
          <SpecialItemTemplatesStep
            templates={state.specialItemTemplates}
            setTemplates={(v) =>
              setState((s) => ({
                ...s,
                specialItemTemplates: typeof v === 'function' ? v(s.specialItemTemplates) : v,
              }))
            }
          />
        )}

        {activeStep === 'organizations' && (
          <OrganizationTemplatesStep
            templates={state.organizationTemplates}
            setTemplates={(v) =>
              setState((s) => ({
                ...s,
                organizationTemplates: typeof v === 'function' ? v(s.organizationTemplates) : v,
              }))
            }
          />
        )}

        {activeStep === 'map' && (
          <div className="text-sm text-ink-200/60 italic">
            {t.worldCreate.mapAutoHint ?? 'Bản đồ sẽ được tạo tự động sau khi tạo thế giới.'}
          </div>
        )}

        <WizardNav
          onBack={isFirstStep ? onCancel : handleBack}
          onNext={handleNext}
          onSaveDraft={onSaveDraft}
          isNextDisabled={!canSubmit}
          isSubmitting={isSubmitting}
          isFinalStep={isFinalStep}
          submitLabel={t.worldCreate.createWorld}
        />
      </div>

      <aside className="lg:w-80 shrink-0">
        <div className="lg:sticky lg:top-8">
          <WizardSummary
            world={{ name: state.name, genre: state.genre } as World}
            resources={state.resources}
            specialCount={state.specialItemTemplates.length}
            organizationCount={state.organizationTemplates.length}
          />
        </div>
      </aside>
    </div>
  );
}
