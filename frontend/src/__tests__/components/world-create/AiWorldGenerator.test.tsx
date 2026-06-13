import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AiWorldGenerator } from '../../../components/world-create/AiWorldGenerator';

describe('AiWorldGenerator', () => {
  const baseProps = {
    prompt: 'A world of ice and fire',
    onChange: vi.fn(),
    onGenerate: vi.fn(),
    isGenerating: false,
  };

  it('renders the prompt textarea and generate button', () => {
    render(<AiWorldGenerator {...baseProps} />);
    expect(screen.getByDisplayValue('A world of ice and fire')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo thế giới|Generate/i })).toBeInTheDocument();
  });

  it('disables the generate button when prompt is empty', () => {
    render(<AiWorldGenerator {...baseProps} prompt="" />);
    const button = screen.getByRole('button', { name: /Tạo thế giới|Generate/i });
    expect(button).toBeDisabled();
  });

  it('shows a Spinner when isGenerating is true', () => {
    render(<AiWorldGenerator {...baseProps} isGenerating />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the error alert with retry when errorMessage is provided', () => {
    const onClearError = vi.fn();
    render(<AiWorldGenerator {...baseProps} errorMessage="Generation failed" onClearError={onClearError} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Generation failed');
    fireEvent.click(screen.getByTestId('ai-retry-button'));
    expect(onClearError).toHaveBeenCalled();
  });

  it('renders the live preview when name/description/genre are provided', () => {
    render(
      <AiWorldGenerator
        {...baseProps}
        previewName="Frosthold"
        previewDescription="A frozen frontier."
        previewGenre="fantasy"
      />,
    );
    expect(screen.getByTestId('ai-world-preview')).toHaveTextContent('Frosthold');
    expect(screen.getByTestId('ai-world-preview')).toHaveTextContent('A frozen frontier.');
    expect(screen.getByTestId('ai-world-preview')).toHaveTextContent('fantasy');
  });

  it('toggles tone chips when provided', () => {
    const onToneToggle = vi.fn();
    render(
      <AiWorldGenerator
        {...baseProps}
        selectedTones={['dark']}
        onToneToggle={onToneToggle}
      />,
    );
    const darkChip = screen.getByRole('button', { name: 'dark' });
    expect(darkChip).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(darkChip);
    expect(onToneToggle).toHaveBeenCalledWith('dark');
  });
});
