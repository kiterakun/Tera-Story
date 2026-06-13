import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReaderHeader } from '../../components/story-reader/ReaderHeader';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    storyReader: {
      prevChapter: 'Chương trước',
      nextChapter: 'Chương tiếp',
    },
    storyNav: {
      chapter: 'Chương',
    },
  }),
}));

const defaultProps = {
  currentChapterIdx: 1,
  totalChapters: 5,
  isOnLatest: false,
  onGoToChapter: vi.fn(),
  onGoToLatest: vi.fn(),
};

describe('ReaderHeader', () => {
  describe('Layout structure', () => {
    it('renders a header landmark with chapter navigation label', () => {
      render(<ReaderHeader {...defaultProps} />);
      expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'Chapter navigation');
    });

    it('renders prev and next buttons with proper aria-labels', () => {
      render(<ReaderHeader {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Chương trước/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Chương tiếp/i })).toBeInTheDocument();
    });
  });

  describe('Chapter progress bar', () => {
    it('renders progressbar when totalChapters > 0', () => {
      render(<ReaderHeader {...defaultProps} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '5');
      expect(progress).toHaveAttribute('aria-valuenow', '2'); // currentChapterIdx 1 + 1 = 2
    });

    it('does not render progressbar when totalChapters is 0', () => {
      render(<ReaderHeader {...defaultProps} totalChapters={0} />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('shows 100% when on latest chapter', () => {
      render(<ReaderHeader {...defaultProps} isOnLatest={true} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '5'); // totalChapters
      // Visual width
      const fill = progress.querySelector('div');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('shows 50% when currentChapterIdx = 2 (3rd of 5)', () => {
      render(<ReaderHeader {...defaultProps} currentChapterIdx={2} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '3');
      const fill = progress.querySelector('div');
      expect(fill).toHaveStyle({ width: '60%' });
    });
  });

  describe('Navigation', () => {
    it('prev button calls onGoToChapter with previous index', () => {
      const onGoToChapter = vi.fn();
      render(<ReaderHeader {...defaultProps} onGoToChapter={onGoToChapter} />);
      fireEvent.click(screen.getByRole('button', { name: /Chương trước/i }));
      expect(onGoToChapter).toHaveBeenCalledWith(0);
    });

    it('prev button disabled when at chapter 0', () => {
      render(<ReaderHeader {...defaultProps} currentChapterIdx={0} />);
      expect(screen.getByRole('button', { name: /Chương trước/i })).toBeDisabled();
    });

    it('prev button disabled when only 1 chapter', () => {
      render(<ReaderHeader {...defaultProps} totalChapters={1} currentChapterIdx={0} />);
      expect(screen.getByRole('button', { name: /Chương trước/i })).toBeDisabled();
    });

    it('next button calls onGoToChapter with next index', () => {
      const onGoToChapter = vi.fn();
      render(<ReaderHeader {...defaultProps} onGoToChapter={onGoToChapter} />);
      fireEvent.click(screen.getByRole('button', { name: /Chương tiếp/i }));
      expect(onGoToChapter).toHaveBeenCalledWith(2);
    });

    it('next button calls onGoToLatest when on second-to-last chapter', () => {
      const onGoToLatest = vi.fn();
      render(<ReaderHeader {...defaultProps} currentChapterIdx={3} onGoToLatest={onGoToLatest} />);
      fireEvent.click(screen.getByRole('button', { name: /Chương tiếp/i }));
      expect(onGoToLatest).toHaveBeenCalledOnce();
    });

    it('next button disabled when on latest', () => {
      render(<ReaderHeader {...defaultProps} isOnLatest={true} />);
      expect(screen.getByRole('button', { name: /Chương tiếp/i })).toBeDisabled();
    });
  });

  describe('Chapter title', () => {
    it('renders chapter title when provided (desktop)', () => {
      render(<ReaderHeader {...defaultProps} chapterTitle="The Dark Forest" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('The Dark Forest');
    });

    it('chapter title uses font-display class', () => {
      render(<ReaderHeader {...defaultProps} chapterTitle="The Dark Forest" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('font-display');
    });

    it('chapter title is hidden on mobile (<640px)', () => {
      render(<ReaderHeader {...defaultProps} chapterTitle="Title" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('hidden');
      expect(title).toHaveClass('sm:block');
    });

    it('does not render title when not provided', () => {
      render(<ReaderHeader {...defaultProps} />);
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });
  });

  describe('Touch target compliance', () => {
    it('both buttons have min-h-[44px] and min-w-[44px]', () => {
      render(<ReaderHeader {...defaultProps} />);
      const prev = screen.getByRole('button', { name: /Chương trước/i });
      const next = screen.getByRole('button', { name: /Chương tiếp/i });
      expect(prev).toHaveClass('min-h-[44px]');
      expect(prev).toHaveClass('min-w-[44px]');
      expect(next).toHaveClass('min-h-[44px]');
      expect(next).toHaveClass('min-w-[44px]');
    });
  });

  describe('Chapter indicator display', () => {
    it('shows current/total chapter count', () => {
      render(<ReaderHeader {...defaultProps} />);
      expect(screen.getByText(/Chương 2 \/ 5/)).toBeInTheDocument();
    });

    it('shows totalChapters when isOnLatest', () => {
      render(<ReaderHeader {...defaultProps} isOnLatest={true} />);
      expect(screen.getByText(/Chương 5 \/ 5/)).toBeInTheDocument();
    });
  });
});
