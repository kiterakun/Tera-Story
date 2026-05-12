import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChronicle } from '../../hooks/useChronicle';

vi.mock('../../services/chronicleApi', () => ({
  fetchChronicle: vi.fn(),
}));

import * as chronicleApi from '../../services/chronicleApi';

const mockChronicleData = {
  playthroughName: 'Test Adventure',
  worldId: 'world123',
  status: 'completed',
  chronicle: {
    generatedAt: new Date().toISOString(),
    arcSummaries: [
      {
        arcId: 'arc1',
        title: 'The Beginning',
        summary: 'A long journey begins...',
        sceneCount: 5,
        keyScenes: [],
      },
    ],
    stats: {
      totalScenes: 5,
      totalChoices: 10,
      totalCombats: 2,
      totalPlayTimeMinutes: 120,
    },
  },
  completedAt: null,
};

describe('useChronicle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with initial loading state', () => {
    vi.mocked(chronicleApi.fetchChronicle).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useChronicle('test-playthrough-id'));

    expect(result.current.chronicle).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches chronicle successfully', async () => {
    vi.mocked(chronicleApi.fetchChronicle).mockResolvedValue({
      status: 'success',
      data: mockChronicleData,
    });

    const { result } = renderHook(() => useChronicle('test-playthrough-id'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.chronicle).toEqual(mockChronicleData);
    expect(result.current.error).toBeNull();
  });

  it('calls API with correct playthroughId', async () => {
    vi.mocked(chronicleApi.fetchChronicle).mockResolvedValue({
      status: 'success',
      data: mockChronicleData,
    });

    renderHook(() => useChronicle('test-playthrough-id'));

    await waitFor(() => {
      expect(chronicleApi.fetchChronicle).toHaveBeenCalledWith('test-playthrough-id', undefined);
    });
  });

  it('passes forceRegenerate=true to API', async () => {
    vi.mocked(chronicleApi.fetchChronicle).mockResolvedValue({
      status: 'success',
      data: mockChronicleData,
    });

    renderHook(() => useChronicle('test-playthrough-id', true));

    await waitFor(() => {
      expect(chronicleApi.fetchChronicle).toHaveBeenCalledWith('test-playthrough-id', true);
    });
  });

  it('sets error state when fetch fails', async () => {
    vi.mocked(chronicleApi.fetchChronicle).mockRejectedValue(new Error('Fail'));

    const { result } = renderHook(() => useChronicle('test-playthrough-id'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.chronicle).toBeNull();
    expect(result.current.error).toBe('Failed to load chronicle');
  });

  it('refetches chronicle when refetch is called', async () => {
    vi.mocked(chronicleApi.fetchChronicle).mockResolvedValue({
      status: 'success',
      data: mockChronicleData,
    });

    const { result } = renderHook(() => useChronicle('test-playthrough-id'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.refetch();

    expect(chronicleApi.fetchChronicle).toHaveBeenCalledTimes(2);
    expect(chronicleApi.fetchChronicle).toHaveBeenLastCalledWith('test-playthrough-id', undefined);
    expect(result.current.chronicle).toEqual(mockChronicleData);
  });
});
