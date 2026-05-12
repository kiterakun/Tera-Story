import { describe, expect, it, vi } from 'vitest';
import GalleryPage from '../../pages/GalleryPage';
import { renderWithRouter, screen } from '../test-utils';
import { useGallery } from '../../hooks/useGallery';

vi.mock('../../hooks/useGallery');
vi.mock('../../services/galleryApi', () => ({
  shareCard: vi.fn(),
}));

const mockUseGalleryReturn = {
  cards: [],
  total: 0,
  totalPages: 0,
  stats: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const storyCard = {
  _id: 'card-1',
  userId: 'user-1',
  playthroughId: 'playthrough-1',
  worldId: 'world-1',
  sceneId: 'scene-1',
  imageUrl: 'https://example.com/card.jpg',
  thumbnailUrl: 'https://example.com/card-thumb.jpg',
  title: 'Moonlit Crossing',
  description: 'A pivotal choice beneath silver trees.',
  rarity: 'rare' as const,
  category: 'story' as const,
  unlockedAt: '2026-05-12T00:00:00.000Z',
  shared: false,
  shareCount: 0,
};

describe('GalleryPage', () => {
  it('renders without crashing', () => {
    vi.mocked(useGallery).mockReturnValue(mockUseGalleryReturn);

    renderWithRouter(<GalleryPage />);

    expect(screen.getByText(/Bạn chưa có thẻ bài nào/i)).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    vi.mocked(useGallery).mockReturnValue({
      ...mockUseGalleryReturn,
      isLoading: true,
    });

    const { container } = renderWithRouter(<GalleryPage />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows cards when data is loaded', () => {
    vi.mocked(useGallery).mockReturnValue({
      ...mockUseGalleryReturn,
      cards: [storyCard],
      total: 1,
      stats: {
        totalCards: 1,
        byRarity: { common: 0, uncommon: 0, rare: 1, epic: 0 },
        byCategory: { story: 1 },
        recentUnlock: [storyCard],
      },
    });

    renderWithRouter(<GalleryPage />);

    expect(screen.getByText(/Bộ Sưu Tập Thẻ Bài/i)).toBeInTheDocument();
    expect(screen.getByText('Moonlit Crossing')).toBeInTheDocument();
    expect(screen.getByText(/1 thẻ/i)).toBeInTheDocument();
  });

  it('shows empty message when no cards are available', () => {
    vi.mocked(useGallery).mockReturnValue(mockUseGalleryReturn);

    renderWithRouter(<GalleryPage />);

    expect(screen.getByText(/Bạn chưa có thẻ bài nào/i)).toBeInTheDocument();
    expect(screen.getByText(/Hãy bắt đầu một cuộc phiêu lưu/i)).toBeInTheDocument();
  });

  it('shows error message when error exists', () => {
    vi.mocked(useGallery).mockReturnValue({
      ...mockUseGalleryReturn,
      error: 'Failed to load gallery',
    });

    renderWithRouter(<GalleryPage />);

    expect(screen.getByText('Failed to load gallery')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();
  });
});
