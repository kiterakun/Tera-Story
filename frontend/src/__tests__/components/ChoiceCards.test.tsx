import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceCards } from '../../components/ChoiceCards';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    choiceCards: {
      whatWillYouDo: 'Bạn sẽ làm gì?',
      customPlaceholder: 'Hoặc nhập lựa chọn của riêng bạn...',
      go: 'Đi',
      aiSuggestions: 'Gợi ý từ AI',
      enrichTooltip: 'Làm phong phú lựa chọn bằng AI',
    },
    toast: {
      aiEnrichFailed: 'Không thể làm phong phú lựa chọn',
    },
  }),
}));

vi.mock('../../lib/toast', () => ({
  showError: vi.fn(),
}));

vi.mock('../../services/supportApi', () => ({
  enrichCustomChoice: vi.fn(),
}));

const defaultChoices = [
  { text: 'Mở cửa', type: 'continue' as const },
  { text: 'Chạy đi', type: 'continue' as const },
  { text: 'Khám phá khu rừng', type: 'new_arc' as const, impact: 'Bạn sẽ bước vào một cuộc phiêu lưu mới', travelHint: 'Đi đến Khu rừng' },
];

describe('ChoiceCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ARIA contract', () => {
    it('renders a radiogroup with aria-label', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const group = screen.getByRole('radiogroup');
      expect(group).toHaveAttribute('aria-label', 'Bạn sẽ làm gì?');
    });

    it('renders each choice as role=radio', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBe(3);
    });

    it('marks first choice as aria-checked initially (focused state)', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('aria-checked', 'true');
      expect(radios[1]).toHaveAttribute('aria-checked', 'false');
      expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });

    it('only focused choice has tabIndex=0 (roving tabindex)', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('tabindex', '0');
      expect(radios[1]).toHaveAttribute('tabindex', '-1');
      expect(radios[2]).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Keyboard navigation', () => {
    it('ArrowDown moves focus to next choice', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
      expect(radios[1]).toHaveFocus();
      expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    });

    it('ArrowUp from first wraps to last', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
      expect(radios[2]).toHaveFocus();
    });

    it('ArrowDown from last wraps to first', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      // Focus last via ArrowUp from first (which wraps)
      fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
      expect(radios[2]).toHaveFocus();
      // ArrowDown from last wraps to first
      fireEvent.keyDown(radios[2], { key: 'ArrowDown' });
      expect(radios[0]).toHaveFocus();
    });

    it('Home jumps to first choice', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
      fireEvent.keyDown(radios[1], { key: 'Home' });
      expect(radios[0]).toHaveFocus();
    });

    it('End jumps to last choice', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      fireEvent.keyDown(radios[0], { key: 'End' });
      expect(radios[2]).toHaveFocus();
    });
  });

  describe('Click selection', () => {
    it('calls onChoiceSelect with the choice text on click', () => {
      const onSelect = vi.fn();
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={onSelect}
        />,
      );
      const radios = screen.getAllByRole('radio');
      fireEvent.click(radios[1]);
      expect(onSelect).toHaveBeenCalledWith('Chạy đi');
    });

    it('does not call onChoiceSelect when isGenerating', () => {
      const onSelect = vi.fn();
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={true}
          playthroughId="p1"
          onChoiceSelect={onSelect}
        />,
      );
      const radios = screen.getAllByRole('radio');
      fireEvent.click(radios[0]);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Visual hierarchy', () => {
    it('renders choice text in font-serif', () => {
      const { container } = render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const choiceText = container.querySelector('.font-serif');
      expect(choiceText).toBeInTheDocument();
    });

    it('renders impact preview below choice text when provided', () => {
      const { container } = render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      expect(container.textContent).toContain('Bạn sẽ bước vào một cuộc phiêu lưu mới');
    });

    it('renders travel hint for new_arc choices', () => {
      const { container } = render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      expect(container.textContent).toContain('Đi đến Khu rừng');
    });
  });

  describe('Custom choice input', () => {
    it('submits custom choice on Enter', () => {
      const onSelect = vi.fn();
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={onSelect}
        />,
      );
      const input = screen.getByPlaceholderText(/Hoặc nhập/i);
      fireEvent.change(input, { target: { value: 'Tùy chọn riêng' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith('Tùy chọn riêng');
    });

    it('disables custom input when isGenerating', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={true}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const input = screen.getByPlaceholderText(/Hoặc nhập/i);
      expect(input).toBeDisabled();
    });
  });

  describe('Touch target compliance', () => {
    it('choice cards have min-h-[88px] for comfortable touch', () => {
      render(
        <ChoiceCards
          choices={defaultChoices}
          isGenerating={false}
          playthroughId="p1"
          onChoiceSelect={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios.forEach((r) => {
        expect(r).toHaveClass('min-h-[88px]');
      });
    });
  });
});

describe('ChoiceCards a11y audit (axe)', () => {
  it('passes axe-core scan', async () => {
    const { axe } = await import('vitest-axe');
    const { container } = render(
      <ChoiceCards
        choices={defaultChoices}
        isGenerating={false}
        playthroughId="p1"
        onChoiceSelect={() => {}}
      />,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
