import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BasicInfoStep } from '../../../components/world-create/BasicInfoStep';

describe('BasicInfoStep', () => {
  const baseProps = {
    name: '',
    setName: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    genre: 'fantasy' as const,
    setGenre: vi.fn(),
    aiPrompt: '',
    setAiPrompt: vi.fn(),
    onAiGenerate: vi.fn(),
    isGenerating: false,
  };

  it('renders without crashing', () => {
    render(<BasicInfoStep {...baseProps} />);
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
  });
});
