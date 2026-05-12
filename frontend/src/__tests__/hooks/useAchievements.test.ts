import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAchievements } from '../../hooks/useAchievements';
import * as achievementApi from '../../services/achievementApi';
import type { AchievementWithProgress, AchievementListResult } from '../../services/achievementApi';

vi.mock('../../services/achievementApi');

const mockAchievement: AchievementWithProgress = {
  _id: '1',
  key: 'first_scene',
  name: { en: 'First Scene', vi: 'Cảnh Đầu' },
  description: { en: 'Complete first scene', vi: 'Hoàn thành cảnh đầu' },
  icon: 'star',
  category: 'milestone',
  rarity: 'common',
  hidden: false,
  unlocked: true,
  unlockedAt: null,
  progress: 1,
  unlockCriteria: { type: 'count', field: 'totalScenesCompleted', threshold: 1 },
  xpReward: 50,
  sortOrder: 1,
};

const mockStats = { total: 10, unlocked: 1, percentComplete: 10 };

function successResponse(data: AchievementListResult) {
  return { status: 'success', data };
}

describe('useAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with loading state and empty data', () => {
    vi.mocked(achievementApi.fetchAchievements).mockResolvedValue(
      successResponse({ achievements: [], stats: { total: 0, unlocked: 0, percentComplete: 0 } })
    );

    const { result } = renderHook(() => useAchievements());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.achievements).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch achievements and update state on success', async () => {
    vi.mocked(achievementApi.fetchAchievements).mockResolvedValue(
      successResponse({ achievements: [mockAchievement], stats: mockStats })
    );

    const { result } = renderHook(() => useAchievements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.achievements).toEqual([mockAchievement]);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
    expect(achievementApi.fetchAchievements).toHaveBeenCalledTimes(1);
  });

  it('should set error state when fetch fails', async () => {
    vi.mocked(achievementApi.fetchAchievements).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAchievements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.achievements).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBe('Failed to load achievements');
  });

  it('should pass parameters and support refetch', async () => {
    vi.mocked(achievementApi.fetchAchievements).mockResolvedValue(
      successResponse({ achievements: [mockAchievement], stats: mockStats })
    );

    const { result } = renderHook(() => useAchievements({ category: 'milestone' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(achievementApi.fetchAchievements).toHaveBeenCalledWith({
      category: 'milestone',
      status: undefined,
      rarity: undefined,
    });

    // refetch with new data
    const updatedAchievement = { ...mockAchievement, key: 'second_scene' };
    vi.mocked(achievementApi.fetchAchievements).mockResolvedValue(
      successResponse({ achievements: [updatedAchievement], stats: { ...mockStats, unlocked: 2, percentComplete: 20 } })
    );

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.achievements).toEqual([updatedAchievement]);
    });

    expect(result.current.stats).toEqual({ total: 10, unlocked: 2, percentComplete: 20 });
    expect(achievementApi.fetchAchievements).toHaveBeenCalledTimes(2);
  });

  it('should re-fetch when params change', async () => {
    vi.mocked(achievementApi.fetchAchievements).mockResolvedValue(
      successResponse({ achievements: [mockAchievement], stats: mockStats })
    );

    const { result, rerender } = renderHook(
      (props) => useAchievements(props),
      { initialProps: undefined }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // change params to trigger re-fetch
    vi.mocked(achievementApi.fetchAchievements).mockResolvedValue(
      successResponse({ achievements: [], stats: { total: 0, unlocked: 0, percentComplete: 0 } })
    );

    rerender({ category: 'exploration', status: 'locked' });

    await waitFor(() => {
      expect(achievementApi.fetchAchievements).toHaveBeenCalledWith({
        category: 'exploration',
        status: 'locked',
        rarity: undefined,
      });
    });
  });
});
