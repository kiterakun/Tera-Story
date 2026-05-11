import { api } from './api';

export interface StoryCard {
  _id: string;
  userId: string;
  playthroughId: string;
  worldId: string;
  sceneId: string;
  choiceId?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  category: 'story' | 'combat' | 'character' | 'discovery' | 'milestone';
  unlockedAt: string;
  shared: boolean;
  shareCount: number;
  publicShareUrl?: string;
}

export interface GalleryListResult {
  cards: StoryCard[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
  };
}

export interface GalleryStats {
  totalCards: number;
  byRarity: Record<string, number>;
  byCategory: Record<string, number>;
  recentUnlock: StoryCard[];
}

export async function fetchGallery(params?: {
  page?: number;
  limit?: number;
  worldId?: string;
  rarity?: string;
  category?: string;
  sort?: string;
}) {
  const res = await api.get<{ status: string; data: GalleryListResult }>('/gallery', { params });
  return res.data;
}

export async function fetchCardDetail(cardId: string) {
  const res = await api.get<{ status: string; data: { card: StoryCard } }>(`/gallery/${cardId}`);
  return res.data;
}

export async function shareCard(cardId: string) {
  const res = await api.post<{ status: string; data: { publicShareUrl: string; shareCount: number } }>(
    `/gallery/${cardId}/share`
  );
  return res.data;
}

export async function fetchGalleryStats() {
  const res = await api.get<{ status: string; data: GalleryStats }>('/gallery/stats');
  return res.data;
}
