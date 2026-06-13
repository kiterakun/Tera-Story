import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WizardNav } from '../../../components/world-create/WizardNav';

describe('WizardNav', () => {
  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<WizardNav onBack={onBack} onNext={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Quay lại/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders the final submit label on the final step', () => {
    render(
      <WizardNav onNext={vi.fn()} isFinalStep submitLabel="Create" />,
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('disables next when isNextDisabled is true', () => {
    render(<WizardNav onNext={vi.fn()} isNextDisabled />);
    const button = screen.getByRole('button', { name: /Tiếp tục/ });
    expect(button).toBeDisabled();
  });
});
