import { useState, useEffect, useCallback } from 'react';
import * as galleryApi from '../services/galleryApi';
import type { StoryCard, GalleryStats } from '../services/galleryApi';

export function useGallery(params?: {
  page?: number;
  limit?: number;
  worldId?: string;
  rarity?: string;
  category?: string;
  sort?: string;
}) {
  const [cards, setCards] = useState<StoryCard[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await galleryApi.fetchGallery({
        page: params?.page,
        limit: params?.limit,
        worldId: params?.worldId,
        rarity: params?.rarity,
        category: params?.category,
        sort: params?.sort,
      });
      setCards(res.data.cards);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      // Also fetch stats
      const statsRes = await galleryApi.fetchGalleryStats();
      setStats(statsRes.data);
    } catch {
      setError('Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.limit, params?.worldId, params?.rarity, params?.category, params?.sort]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { cards, total, totalPages, stats, isLoading, error, refetch: fetch };
}
