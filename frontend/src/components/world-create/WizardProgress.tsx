import { Check } from 'lucide-react';
import { cn } from '../../design-system/cn';

export type WizardStepId = 'basic' | 'map' | 'resources' | 'special-items' | 'organizations';

interface WizardProgressProps {
  steps: { id: WizardStepId; label: string }[];
  currentStep: WizardStepId;
  completed: Set<WizardStepId>;
  onStepClick?: (step: WizardStepId) => void;
}

export function WizardProgress({ steps, currentStep, completed, onStepClick }: WizardProgressProps) {
  return (
    <ol
      className="flex items-center gap-2 overflow-x-auto pb-2"
      aria-label="Wizard progress"
    >
      {steps.map((step, idx) => {
        const isCurrent = step.id === currentStep;
        const isComplete = completed.has(step.id);
        const canClick = onStepClick && (isComplete || step.id === currentStep);
        return (
          <li key={step.id} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onStepClick(step.id)}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                isCurrent
                  ? 'bg-accent-500/20 text-accent-200 border border-accent-500/40'
                  : isComplete
                    ? 'bg-success/10 text-success border border-success/30 cursor-pointer'
                    : 'text-ink-200/50 border border-ink-700',
                !canClick && 'cursor-not-allowed',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                  isCurrent
                    ? 'bg-accent-500 text-white'
                    : isComplete
                      ? 'bg-success text-white'
                      : 'bg-ink-700 text-ink-200',
                )}
                aria-hidden="true"
              >
                {isComplete ? <Check size={10} /> : idx + 1}
              </span>
              <span>{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <span className="w-6 h-px bg-ink-700" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
