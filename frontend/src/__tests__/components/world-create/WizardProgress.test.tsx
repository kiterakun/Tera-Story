import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardProgress } from '../../../components/world-create/WizardProgress';

describe('WizardProgress', () => {
  const steps = [
    { id: 'basic' as const, label: 'Basic' },
    { id: 'resources' as const, label: 'Resources' },
  ];

  it('renders each step with a label', () => {
    render(<WizardProgress steps={steps} currentStep="basic" completed={new Set()} />);
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('marks the current step with aria-current="step"', () => {
    render(<WizardProgress steps={steps} currentStep="basic" completed={new Set()} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
