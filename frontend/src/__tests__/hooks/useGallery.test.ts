import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGallery } from '../../hooks/useGallery';
import * as galleryApi from '../../services/galleryApi';
import type { GalleryListResult, GalleryStats, StoryCard } from '../../services/galleryApi';

vi.mock('../../services/galleryApi');

const emptyGalleryStats: GalleryStats = {
  totalCards: 0,
  byRarity: {},
  byCategory: {},
  recentUnlock: [],
};

function galleryResponse(data: GalleryListResult): Awaited<ReturnType<typeof galleryApi.fetchGallery>> {
  return { status: 'success', data };
}

function statsResponse(data: GalleryStats): Awaited<ReturnType<typeof galleryApi.fetchGalleryStats>> {
  return { status: 'success', data };
}

function galleryData(overrides: Partial<GalleryListResult> = {}): GalleryListResult {
  return {
    cards: [],
    total: 0,
    page: 1,
    totalPages: 0,
    stats: {
      total: 0,
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
    },
    ...overrides,
  };
}

describe('useGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state and empty data', () => {
    vi.mocked(galleryApi.fetchGallery).mockResolvedValue(galleryResponse(galleryData()));
    vi.mocked(galleryApi.fetchGalleryStats).mockResolvedValue(statsResponse(emptyGalleryStats));

    const { result } = renderHook(() => useGallery());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.cards).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch data and update state on success', async () => {
    const mockCards: StoryCard[] = [
      {
        _id: 'card1',
        userId: 'user1',
        playthroughId: 'pt1',
        worldId: 'world1',
        sceneId: 'scene1',
        imageUrl: 'https://example.com/img.png',
        title: 'Test Card',
        description: 'A test card',
        rarity: 'common',
        category: 'story',
        unlockedAt: new Date().toISOString(),
        shared: false,
        shareCount: 0,
      },
    ];
    const mockStats: GalleryStats = {
      totalCards: 1,
      byRarity: { common: 1 },
      byCategory: { story: 1 },
      recentUnlock: [],
    };

    vi.mocked(galleryApi.fetchGallery).mockResolvedValue(
      galleryResponse(galleryData({ cards: mockCards, total: 1, totalPages: 1 }))
    );
    vi.mocked(galleryApi.fetchGalleryStats).mockResolvedValue(statsResponse(mockStats));

    const { result } = renderHook(() => useGallery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cards).toEqual(mockCards);
    expect(result.current.total).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('should set error on failure', async () => {
    vi.mocked(galleryApi.fetchGallery).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGallery());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load gallery');
    expect(result.current.cards).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should expose a refetch function that triggers a new fetch', async () => {
    vi.mocked(galleryApi.fetchGallery).mockResolvedValue(galleryResponse(galleryData()));
    vi.mocked(galleryApi.fetchGalleryStats).mockResolvedValue(statsResponse(emptyGalleryStats));

    const { result } = renderHook(() => useGallery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');

    vi.clearAllMocks();
    vi.mocked(galleryApi.fetchGallery).mockResolvedValue(galleryResponse(galleryData()));
    vi.mocked(galleryApi.fetchGalleryStats).mockResolvedValue(statsResponse(emptyGalleryStats));

    result.current.refetch();

    await waitFor(() => {
      expect(galleryApi.fetchGallery).toHaveBeenCalledTimes(1);
      expect(galleryApi.fetchGalleryStats).toHaveBeenCalledTimes(1);
    });
  });

  it('should pass parameters to fetchGallery', async () => {
    vi.mocked(galleryApi.fetchGallery).mockResolvedValue(galleryResponse(galleryData()));
    vi.mocked(galleryApi.fetchGalleryStats).mockResolvedValue(statsResponse(emptyGalleryStats));

    const params = {
      page: 2,
      limit: 10,
      worldId: 'world-abc',
      rarity: 'rare',
      category: 'combat',
      sort: 'newest',
    };

    renderHook(() => useGallery(params));

    await waitFor(() => expect(galleryApi.fetchGallery).toHaveBeenCalled());

    expect(galleryApi.fetchGallery).toHaveBeenCalledWith(params);
  });

  it('should re-fetch when params change', async () => {
    vi.mocked(galleryApi.fetchGallery).mockResolvedValue(galleryResponse(galleryData()));
    vi.mocked(galleryApi.fetchGalleryStats).mockResolvedValue(statsResponse(emptyGalleryStats));

    const { rerender } = renderHook((params?: { page?: number }) => useGallery(params), {
      initialProps: { page: 1 },
    });

    await waitFor(() => expect(galleryApi.fetchGallery).toHaveBeenCalledTimes(1));

    rerender({ page: 2 });

    await waitFor(() => expect(galleryApi.fetchGallery).toHaveBeenCalledTimes(2));

    expect(galleryApi.fetchGallery).toHaveBeenLastCalledWith({ page: 2 });
  });
});
