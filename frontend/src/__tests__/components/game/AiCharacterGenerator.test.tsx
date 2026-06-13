import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AiCharacterGenerator } from '../../../components/game/AiCharacterGenerator';

describe('AiCharacterGenerator', () => {
  const baseProps = {
    prompt: 'A reclusive cartographer',
    onChange: vi.fn(),
    onGenerate: vi.fn(),
    isGenerating: false,
  };

  it('renders the prompt textarea and generate button', () => {
    render(<AiCharacterGenerator {...baseProps} />);
    expect(screen.getByDisplayValue('A reclusive cartographer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo bằng AI|Generate/i })).toBeInTheDocument();
  });

  it('shows a Spinner when isGenerating is true', () => {
    render(<AiCharacterGenerator {...baseProps} isGenerating />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the error alert with retry button when errorMessage is provided', () => {
    const onClearError = vi.fn();
    render(<AiCharacterGenerator {...baseProps} errorMessage="Failed" onClearError={onClearError} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    fireEvent.click(screen.getByTestId('ai-retry-button'));
    expect(onClearError).toHaveBeenCalled();
  });

  it('renders the live preview block', () => {
    render(
      <AiCharacterGenerator
        {...baseProps}
        previewName="Linh"
        previewRole="protagonist"
        previewDescription="A careful scout."
      />,
    );
    expect(screen.getByTestId('ai-character-preview')).toHaveTextContent('Linh');
    expect(screen.getByTestId('ai-character-preview')).toHaveTextContent('protagonist');
  });
});
