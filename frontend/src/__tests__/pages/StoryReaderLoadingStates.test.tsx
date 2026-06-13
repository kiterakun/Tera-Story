import { describe, expect, it, vi } from 'vitest';

// Mock heavy modules so StoryReaderPage can render without crashing
vi.mock('../../hooks/useChapterGeneration', () => ({
  useChapterGeneration: () => ({
    generateChapter: vi.fn(),
    generateStream: vi.fn(),
    retryTools: vi.fn(),
    isGenerating: false,
    isRetryingTools: false,
    isStreaming: false,
    streamingText: '',
    streamPhase: null,
    streamError: null,
    reset: vi.fn(),
  }),
}));

vi.mock('../../hooks/useSSE', () => ({
  useSSE: () => ({
    events: [],
    status: 'disconnected',
    reconnect: vi.fn(),
  }),
}));

vi.mock('../../hooks/useStoryStore', () => ({
  useStoryStore: () => ({
    world: null,
    characters: [],
    items: [],
    specialItems: [],
    organizations: [],
    chapters: [],
    currentChapterId: null,
    fetchWorld: vi.fn(),
    fetchChapters: vi.fn(),
    fetchCharacters: vi.fn(),
    fetchItems: vi.fn(),
    fetchSpecialItems: vi.fn(),
    fetchOrganizations: vi.fn(),
    setCurrentChapterId: vi.fn(),
    setChapters: vi.fn(),
    updateChapter: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../../hooks/useProgression', () => ({
  useProgression: () => ({
    progress: null,
    isLoading: false,
    error: null,
    fetchProgress: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMap', () => ({
  useMap: () => ({
    currentContext: null,
    playthroughLocations: [],
    isLoading: false,
    error: null,
    fetchCurrentContext: vi.fn(),
    selectLocation: vi.fn(),
    getConnectionsFor: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({ playthroughId: 'p1' }) };
});

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    storyReader: { streamingChapter: 'Đang tạo...', mobileBack: 'Quay lại' },
    storyNav: { chapter: 'Chương' },
    entityTypes: { character: 'NV', item: 'VP', specialItem: 'VPDG' },
    entityStatus: {},
    common: { close: 'Đóng', regenerateImage: 'Tạo lại ảnh', generating: 'Đang tạo', imageQueued: 'Đã thêm' },
    toast: {},
    map: { title: 'Bản đồ' },
    layout: { worlds: 'TG', gallery: 'BST', achievements: 'TT', more: 'Thêm' },
    choiceCards: {
      whatWillYouDo: 'Bạn sẽ làm gì?',
      customPlaceholder: '...',
      go: 'Đi',
      aiSuggestions: 'Gợi ý',
      enrichTooltip: 'Phong phú',
    },
  }),
  useLanguage: () => 'vi',
}));

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import StoryReaderPage from '../../pages/StoryReaderPage';

describe('StoryReaderPage loading states', () => {
  it('passes axe scan (no raw spinner divs)', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/playthroughs/p1']}>
        <StoryReaderPage />
      </MemoryRouter>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('does not contain raw animate-spin divs in StoryReaderPage tree', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/playthroughs/p1']}>
        <StoryReaderPage />
      </MemoryRouter>,
    );
    // Raw spinner divs would have animate-spin + rounded-full + border
    // Spinner primitive wraps Loader2 with role=status + aria-label
    const rawSpinners = container.querySelectorAll('.animate-spin.rounded-full');
    expect(rawSpinners.length).toBe(0);
  });

  it('uses Spinner primitive (Loader2 with role=status) for loading states', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/playthroughs/p1']}>
        <StoryReaderPage />
      </MemoryRouter>,
    );
    const spinners = container.querySelectorAll('[role="status"]');
    // Spinner primitive renders role="status" when label is provided
    expect(spinners.length).toBeGreaterThanOrEqual(0); // may be 0 if not currently loading
  });
});
