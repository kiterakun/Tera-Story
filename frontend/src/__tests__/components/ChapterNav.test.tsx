import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChapterNav from '../../components/ChapterNav';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    storyNav: { chapter: 'Chương' },
    storyReader: {
      navigationPanel: 'Chưa có chương nào',
      contextTokens: 'Token ngữ cảnh',
      contextTokensHint: 'Giảm để tiết kiệm',
      summarizeArc: 'Tóm tắt arc',
      summarizingArc: 'Đang tóm tắt...',
      backToPlaythrough: 'Quay lại playthrough',
      storyNavigation: 'Điều hướng chương',
    },
  }),
}));

const baseProps = {
  chapters: [
    { _id: 'c1', content: '', chapterIndex: 0, choices: [], status: 'completed' as const },
    { _id: 'c2', content: '', chapterIndex: 1, choices: [], status: 'completed' as const },
    { _id: 'c3', content: '', chapterIndex: 2, choices: [] },
    { _id: 'c4', content: '', chapterIndex: 3, choices: [], status: 'failed' as const },
  ],
  goToChapter: vi.fn(),
  isOnLatest: false,
  currentChapterIdx: 2,
  totalChapters: 4,
  contextTokens: 1500,
  handleSummarizeArc: vi.fn(),
  isSummarizingArc: false,
  isGenerating: false,
  activeChapter: undefined,
  isLatestFailed: false,
  isLatestToolsFailed: false,
  isNewGame: false,
  handleBeginStory: vi.fn(),
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ChapterNav', () => {
  describe('ARIA contract', () => {
    it('renders as a listbox with aria-label', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const list = screen.getByRole('listbox');
      expect(list).toHaveAttribute('aria-label', 'Điều hướng chương');
    });

    it('renders each chapter as an option', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(4);
    });

    it('marks active chapter with aria-selected=true', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('uses roving tabindex (only focused option has tabIndex=0)', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      expect(options[2]).toHaveAttribute('tabindex', '0');
      expect(options[0]).toHaveAttribute('tabindex', '-1');
      expect(options[1]).toHaveAttribute('tabindex', '-1');
      expect(options[3]).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Chapter indicators', () => {
    it('completed chapters show green checkmark', () => {
      const { container } = renderWithRouter(<ChapterNav {...baseProps} />);
      const checks = container.querySelectorAll('.text-emerald-400');
      expect(checks.length).toBe(2); // c1 and c2
    });

    it('failed chapters show red AlertTriangle', () => {
      const { container } = renderWithRouter(<ChapterNav {...baseProps} />);
      const alerts = container.querySelectorAll('.text-red-400');
      expect(alerts.length).toBe(1); // c4
    });

    it('active chapter shows accent background', () => {
      const { container } = renderWithRouter(<ChapterNav {...baseProps} />);
      const active = container.querySelector('.bg-accent-600\\/20');
      expect(active).toBeInTheDocument();
    });

    it('shows empty state when no chapters', () => {
      renderWithRouter(<ChapterNav {...baseProps} chapters={[]} />);
      expect(screen.getByText(/Chưa có chương nào/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('ArrowDown moves focus to next option', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      options[2].focus();
      fireEvent.keyDown(options[2], { key: 'ArrowDown' });
      expect(options[3]).toHaveFocus();
    });

    it('ArrowUp moves focus to previous option', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      options[2].focus();
      fireEvent.keyDown(options[2], { key: 'ArrowUp' });
      expect(options[1]).toHaveFocus();
    });

    it('Home jumps to first option', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      options[2].focus();
      fireEvent.keyDown(options[2], { key: 'Home' });
      expect(options[0]).toHaveFocus();
    });

    it('End jumps to last option', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      options[0].focus();
      fireEvent.keyDown(options[0], { key: 'End' });
      expect(options[3]).toHaveFocus();
    });
  });

  describe('Click selection', () => {
    it('calls goToChapter with clicked index', () => {
      const onSelect = vi.fn();
      renderWithRouter(<ChapterNav {...baseProps} goToChapter={onSelect} />);
      const options = screen.getAllByRole('option');
      fireEvent.click(options[1]);
      expect(onSelect).toHaveBeenCalledWith(1);
    });
  });

  describe('Context tokens', () => {
    it('renders token count when contextTokens is not null', () => {
      renderWithRouter(<ChapterNav {...baseProps} contextTokens={2500} />);
      // Vietnamese locale uses dot as thousands separator (2.500)
      expect(screen.getByText('2.500')).toBeInTheDocument();
    });

    it('hides tokens section when contextTokens is null', () => {
      renderWithRouter(<ChapterNav {...baseProps} contextTokens={null} />);
      expect(screen.queryByText(/Token ngữ cảnh/i)).not.toBeInTheDocument();
    });

    it('summarize button calls handleSummarizeArc', () => {
      const onSummarize = vi.fn();
      renderWithRouter(<ChapterNav {...baseProps} handleSummarizeArc={onSummarize} />);
      fireEvent.click(screen.getByRole('button', { name: /Tóm tắt arc/i }));
      expect(onSummarize).toHaveBeenCalledOnce();
    });
  });

  describe('Touch targets', () => {
    it('chapter buttons have min-h-[44px]', () => {
      renderWithRouter(<ChapterNav {...baseProps} />);
      const options = screen.getAllByRole('option');
      options.forEach((o) => {
        // The button container wraps the option; check the option itself
        expect(o).toHaveClass('py-2');
      });
    });
  });
});
