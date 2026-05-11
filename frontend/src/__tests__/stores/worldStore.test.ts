import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorldStore } from '../../stores/worldStore';

vi.mock('../../services/worldApi', () => ({
  listWorlds: vi.fn(),
  getWorld: vi.fn(),
  createWorld: vi.fn(),
  createFromTemplate: vi.fn(),
  updateWorld: vi.fn(),
  deleteWorld: vi.fn(),
}));

import * as worldApi from '../../services/worldApi';

const mockWorld = { _id: 'w1', name: 'Test World', description: 'A world', genre: 'fantasy' as const, resourceTemplates: [], createdAt: '2024-01-01', updatedAt: '2024-01-01' };
const mockWorld2 = { _id: 'w2', name: 'Second World', description: 'Another', genre: 'sci-fi' as const, resourceTemplates: [], createdAt: '2024-02-01', updatedAt: '2024-02-01' };
const mockTemplate = { _id: 't1', category: 'artifact', description: 'magic item', fields: [] };

const initialState = { worlds: [], currentWorld: null, currentWorldTemplates: [], isLoading: false };

beforeEach(() => {
  useWorldStore.setState(initialState);
  vi.clearAllMocks();
});

describe('worldStore', () => {
  describe('initial state', () => {
    it('has empty worlds', () => {
      expect(useWorldStore.getState().worlds).toEqual([]);
    });
    it('has null currentWorld', () => {
      expect(useWorldStore.getState().currentWorld).toBeNull();
    });
    it('has empty currentWorldTemplates', () => {
      expect(useWorldStore.getState().currentWorldTemplates).toEqual([]);
    });
    it('has isLoading false', () => {
      expect(useWorldStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchWorlds', () => {
    it('sets isLoading true, fetches, sets worlds', async () => {
      vi.mocked(worldApi.listWorlds).mockResolvedValue([mockWorld, mockWorld2]);

      const promise = useWorldStore.getState().fetchWorlds();
      expect(useWorldStore.getState().isLoading).toBe(true);
      await promise;

      expect(worldApi.listWorlds).toHaveBeenCalled();
      expect(useWorldStore.getState().worlds).toEqual([mockWorld, mockWorld2]);
      expect(useWorldStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(worldApi.listWorlds).mockRejectedValue(new Error('Fail'));

      await expect(useWorldStore.getState().fetchWorlds()).rejects.toThrow('Fail');
      expect(useWorldStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchWorld', () => {
    it('sets isLoading true, fetches, sets currentWorld and templates', async () => {
      vi.mocked(worldApi.getWorld).mockResolvedValue({ world: mockWorld, specialItemTemplates: [mockTemplate] });

      const promise = useWorldStore.getState().fetchWorld('w1');
      expect(useWorldStore.getState().isLoading).toBe(true);
      await promise;

      expect(worldApi.getWorld).toHaveBeenCalledWith('w1');
      expect(useWorldStore.getState().currentWorld).toEqual(mockWorld);
      expect(useWorldStore.getState().currentWorldTemplates).toEqual([mockTemplate]);
      expect(useWorldStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(worldApi.getWorld).mockRejectedValue(new Error('Not found'));

      await expect(useWorldStore.getState().fetchWorld('bad')).rejects.toThrow('Not found');
      expect(useWorldStore.getState().isLoading).toBe(false);
    });
  });

  describe('createWorld', () => {
    it('sets isLoading true, creates world, appends to worlds, returns it', async () => {
      vi.mocked(worldApi.createWorld).mockResolvedValue({ world: mockWorld, specialItemTemplates: [] });

      const promise = useWorldStore.getState().createWorld({ name: 'New World', description: 'desc', genre: 'fantasy' });
      expect(useWorldStore.getState().isLoading).toBe(true);

      const result = await promise;

      expect(worldApi.createWorld).toHaveBeenCalledWith({ name: 'New World', description: 'desc', genre: 'fantasy' });
      expect(result).toEqual(mockWorld);
      expect(useWorldStore.getState().worlds).toEqual([mockWorld]);
      expect(useWorldStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(worldApi.createWorld).mockRejectedValue(new Error('Fail'));

      await expect(useWorldStore.getState().createWorld({ name: 'X' })).rejects.toThrow('Fail');
      expect(useWorldStore.getState().isLoading).toBe(false);
    });
  });

  describe('createFromTemplate', () => {
    it('sets isLoading true, creates from template, appends to worlds, returns it', async () => {
      vi.mocked(worldApi.createFromTemplate).mockResolvedValue({ world: mockWorld, specialItemTemplates: [mockTemplate] });

      const promise = useWorldStore.getState().createFromTemplate('template1', 'New from Template');
      expect(useWorldStore.getState().isLoading).toBe(true);

      const result = await promise;

      expect(worldApi.createFromTemplate).toHaveBeenCalledWith('template1', 'New from Template');
      expect(result).toEqual(mockWorld);
      expect(useWorldStore.getState().worlds).toEqual([mockWorld]);
      expect(useWorldStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(worldApi.createFromTemplate).mockRejectedValue(new Error('Fail'));

      await expect(useWorldStore.getState().createFromTemplate('t1', 'name')).rejects.toThrow('Fail');
      expect(useWorldStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateWorld', () => {
    it('sets isLoading true, updates world in array, returns updated world', async () => {
      useWorldStore.setState({ worlds: [mockWorld, mockWorld2] });
      const updated = { ...mockWorld, name: 'Updated World' };
      vi.mocked(worldApi.updateWorld).mockResolvedValue(updated);

      const promise = useWorldStore.getState().updateWorld('w1', { name: 'Updated World' });
      expect(useWorldStore.getState().isLoading).toBe(true);

      const result = await promise;

      expect(worldApi.updateWorld).toHaveBeenCalledWith('w1', { name: 'Updated World' });
      expect(result).toEqual(updated);
      expect(useWorldStore.getState().worlds).toEqual([updated, mockWorld2]);
      expect(useWorldStore.getState().isLoading).toBe(false);
    });

    it('updates currentWorld when the updated world matches currentWorld id', async () => {
      useWorldStore.setState({ worlds: [mockWorld], currentWorld: mockWorld });
      const updated = { ...mockWorld, name: 'Updated' };
      vi.mocked(worldApi.updateWorld).mockResolvedValue(updated);

      await useWorldStore.getState().updateWorld('w1', { name: 'Updated' });

      expect(useWorldStore.getState().currentWorld).toEqual(updated);
    });

    it('does not update currentWorld when ids differ', async () => {
      useWorldStore.setState({ worlds: [mockWorld, mockWorld2], currentWorld: mockWorld2 });
      const updated = { ...mockWorld, name: 'Updated' };
      vi.mocked(worldApi.updateWorld).mockResolvedValue(updated);

      await useWorldStore.getState().updateWorld('w1', { name: 'Updated' });

      expect(useWorldStore.getState().currentWorld).toEqual(mockWorld2);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(worldApi.updateWorld).mockRejectedValue(new Error('Fail'));

      await expect(useWorldStore.getState().updateWorld('w1', {})).rejects.toThrow('Fail');
      expect(useWorldStore.getState().isLoading).toBe(false);
    });
  });

  describe('deleteWorld', () => {
    it('sets isLoading true, deletes, removes from worlds', async () => {
      useWorldStore.setState({ worlds: [mockWorld, mockWorld2] });
      vi.mocked(worldApi.deleteWorld).mockResolvedValue(undefined);

      const promise = useWorldStore.getState().deleteWorld('w1');
      expect(useWorldStore.getState().isLoading).toBe(true);
      await promise;

      expect(worldApi.deleteWorld).toHaveBeenCalledWith('w1');
      expect(useWorldStore.getState().worlds).toEqual([mockWorld2]);
      expect(useWorldStore.getState().isLoading).toBe(false);
    });

    it('clears currentWorld and templates when deleting current world', async () => {
      useWorldStore.setState({ worlds: [mockWorld], currentWorld: mockWorld, currentWorldTemplates: [mockTemplate] });
      vi.mocked(worldApi.deleteWorld).mockResolvedValue(undefined);

      await useWorldStore.getState().deleteWorld('w1');

      expect(useWorldStore.getState().currentWorld).toBeNull();
      expect(useWorldStore.getState().currentWorldTemplates).toEqual([]);
    });

    it('preserves currentWorld when deleting a different world', async () => {
      useWorldStore.setState({ worlds: [mockWorld, mockWorld2], currentWorld: mockWorld2, currentWorldTemplates: [mockTemplate] });
      vi.mocked(worldApi.deleteWorld).mockResolvedValue(undefined);

      await useWorldStore.getState().deleteWorld('w1');

      expect(useWorldStore.getState().currentWorld).toEqual(mockWorld2);
      expect(useWorldStore.getState().currentWorldTemplates).toEqual([mockTemplate]);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(worldApi.deleteWorld).mockRejectedValue(new Error('Fail'));

      await expect(useWorldStore.getState().deleteWorld('w1')).rejects.toThrow('Fail');
      expect(useWorldStore.getState().isLoading).toBe(false);
    });
  });
});
