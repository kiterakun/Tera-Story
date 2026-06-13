import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReaderMobileNav } from '../../components/story-reader/ReaderMobileNav';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    storyReader: {
      rpgPanel: 'Bảng RPG',
      storyNavigation: 'Điều hướng chương',
      mobileBack: 'Quay lại',
      mobileChapters: 'Chương',
      mobileRpg: 'RPG',
    },
    map: { title: 'Bản đồ' },
  }),
}));

// Mocks for the Drawer children
vi.mock('../../components/MobileDrawer', () => ({
  MobileDrawer: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
    isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));

vi.mock('../../components/ChapterNav', () => ({
  default: () => <div data-testid="chapter-nav" />,
}));

vi.mock('../../components/RPGPanel', () => ({
  default: () => <div data-testid="rpg-panel" />,
}));

vi.mock('../../stores/storyStore', () => ({
  useStoryStore: () => ({ world: null }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ playthroughId: 'p1' }) };
});

const baseProps = {
  navOpen: false,
  setNavOpen: vi.fn(),
  rpgOpen: false,
  setRpgOpen: vi.fn(),
  chapters: [],
  goToChapter: vi.fn(),
  isOnLatest: false,
  currentChapterIdx: 0,
  totalChapters: 0,
  contextTokens: null,
  handleSummarizeArc: vi.fn(),
  isSummarizingArc: false,
  isGenerating: false,
  activeChapter: undefined,
  isLatestFailed: false,
  isLatestToolsFailed: false,
  isNewGame: false,
  handleBeginStory: vi.fn(),
  navigateBack: vi.fn(),
  rpgTab: 'stats' as const,
  setRpgTab: vi.fn(),
  tabLabels: { stats: 'Stats', inventory: 'Items', abilities: 'Abilities', relations: 'Relations' },
  protagonist: null,
  sortedNpcs: [],
  sortedItems: [],
  sortedSpecialItems: [],
  characters: [],
  relationships: [],
  setDetailEntity: vi.fn(),
  setIsRelationshipModalOpen: vi.fn(),
  isRelationshipModalOpen: false,
};

describe('ReaderMobileNav bottom bar', () => {
  it('renders a nav landmark with mobile reader label', () => {
    render(<ReaderMobileNav {...baseProps} />);
    expect(screen.getByRole('navigation', { name: /mobile reader/i })).toBeInTheDocument();
  });

  it('renders 4 tab buttons with aria-labels', () => {
    render(<ReaderMobileNav {...baseProps} />);
    expect(screen.getByRole('button', { name: /Quay lại/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chương/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bản đồ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RPG/i })).toBeInTheDocument();
  });

  it('tab buttons have min-h-[44px] touch target', () => {
    render(<ReaderMobileNav {...baseProps} />);
    const buttons = screen.getAllByRole('button');
    // 4 tab buttons + 0 drawer (closed) = 4
    expect(buttons.length).toBe(4);
    buttons.forEach((b) => {
      expect(b).toHaveClass('min-h-[44px]');
    });
  });

  it('chapters button has aria-expanded attribute', () => {
    render(<ReaderMobileNav {...baseProps} />);
    const chaptersBtn = screen.getByRole('button', { name: /Chương/i });
    expect(chaptersBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('RPG button has aria-expanded attribute', () => {
    render(<ReaderMobileNav {...baseProps} />);
    const rpgBtn = screen.getByRole('button', { name: /RPG/i });
    expect(rpgBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('chapter count badge is decorative (aria-hidden)', () => {
    render(<ReaderMobileNav {...baseProps} totalChapters={5} />);
    // The badge shows "5" but should be aria-hidden
    const badge = screen.getByText('5');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
  });

  it('icons have aria-hidden=true', () => {
    const { container } = render(<ReaderMobileNav {...baseProps} />);
    // 4 icons (ChevronLeft, List, Compass, Swords)
    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it('uses focus-visible ring classes for keyboard a11y', () => {
    render(<ReaderMobileNav {...baseProps} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((b) => {
      expect(b.className).toMatch(/focus-visible:ring/);
    });
  });

  it('hides on lg breakpoint (lg:hidden)', () => {
    render(<ReaderMobileNav {...baseProps} />);
    const nav = screen.getByRole('navigation', { name: /mobile reader/i });
    expect(nav).toHaveClass('lg:hidden');
  });
});
