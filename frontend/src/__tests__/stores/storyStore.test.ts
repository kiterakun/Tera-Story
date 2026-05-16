import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStoryStore } from '../../stores/storyStore';

vi.mock('../../services/playthroughApi', () => ({
  getPlaythrough: vi.fn(),
  listCharacters: vi.fn(),
  listArcs: vi.fn(),
  listItems: vi.fn(),
  listSpecialItems: vi.fn(),
  createCharacter: vi.fn(),
}));

vi.mock('../../services/worldApi', () => ({
  getWorld: vi.fn().mockResolvedValue({ world: { _id: 'w1', name: 'Test World' }, specialItemTemplates: [] }),
}));

import * as playthroughApi from '../../services/playthroughApi';

const mockPlaythrough = { _id: 'p1', name: 'Test Story', worldId: 'w1', status: 'active' as const, currentArcIndex: 0, createdAt: '2024-01-01' };
const mockCharacter = { _id: 'c1', name: 'Hero', description: 'Brave', role: 'protagonist' as const, status: 'active' as const, dynamicStats: [], background: '', personality: '', goals: '', appearance: '', playthroughId: 'p1', worldId: 'w1', userId: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-01' };
const mockArc = { _id: 'a1', title: 'First Arc', arcIndex: 0, status: 'active' as const };
const mockItem = { _id: 'i1', name: 'Sword', description: 'Sharp', rarity: 'common' as const, status: 'active' as const, properties: {}, playthroughId: 'p1', createdAt: '2024-01-01' };
const mockSpecialItem = { _id: 'si1', name: 'Amulet', description: 'Magic', category: 'artifact', rarity: 'rare' as const, status: 'active' as const, customFields: {}, playthroughId: 'p1', createdAt: '2024-01-01' };

const initialState = { currentPlaythrough: null, characters: [], arcs: [], items: [], specialItems: [], isLoading: false };

beforeEach(() => {
  useStoryStore.setState(initialState);
  vi.clearAllMocks();
});

describe('storyStore', () => {
  describe('initial state', () => {
    it('has null currentPlaythrough', () => {
      expect(useStoryStore.getState().currentPlaythrough).toBeNull();
    });
    it('has empty characters array', () => {
      expect(useStoryStore.getState().characters).toEqual([]);
    });
    it('has empty arcs array', () => {
      expect(useStoryStore.getState().arcs).toEqual([]);
    });
    it('has empty items array', () => {
      expect(useStoryStore.getState().items).toEqual([]);
    });
    it('has empty specialItems array', () => {
      expect(useStoryStore.getState().specialItems).toEqual([]);
    });
    it('has isLoading false', () => {
      expect(useStoryStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchPlaythrough', () => {
    it('sets isLoading true, fetches, sets currentPlaythrough', async () => {
      vi.mocked(playthroughApi.getPlaythrough).mockResolvedValue(mockPlaythrough);

      const promise = useStoryStore.getState().fetchPlaythrough('p1');
      expect(useStoryStore.getState().isLoading).toBe(true);
      await promise;

      expect(playthroughApi.getPlaythrough).toHaveBeenCalledWith('p1');
      expect(useStoryStore.getState().currentPlaythrough).toEqual(mockPlaythrough);
      expect(useStoryStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(playthroughApi.getPlaythrough).mockRejectedValue(new Error('Not found'));

      await expect(useStoryStore.getState().fetchPlaythrough('bad')).rejects.toThrow('Not found');
      expect(useStoryStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchCharacters', () => {
    it('sets isLoading true, fetches, sets characters', async () => {
      vi.mocked(playthroughApi.listCharacters).mockResolvedValue([mockCharacter]);

      const promise = useStoryStore.getState().fetchCharacters('p1');
      expect(useStoryStore.getState().isLoading).toBe(true);
      await promise;

      expect(playthroughApi.listCharacters).toHaveBeenCalledWith('p1');
      expect(useStoryStore.getState().characters).toEqual([mockCharacter]);
      expect(useStoryStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(playthroughApi.listCharacters).mockRejectedValue(new Error('Fail'));

      await expect(useStoryStore.getState().fetchCharacters('p1')).rejects.toThrow('Fail');
      expect(useStoryStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchArcs', () => {
    it('sets isLoading true, fetches, sets arcs', async () => {
      vi.mocked(playthroughApi.listArcs).mockResolvedValue([mockArc]);

      const promise = useStoryStore.getState().fetchArcs('p1');
      expect(useStoryStore.getState().isLoading).toBe(true);
      await promise;

      expect(playthroughApi.listArcs).toHaveBeenCalledWith('p1');
      expect(useStoryStore.getState().arcs).toEqual([mockArc]);
      expect(useStoryStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(playthroughApi.listArcs).mockRejectedValue(new Error('Fail'));

      await expect(useStoryStore.getState().fetchArcs('p1')).rejects.toThrow('Fail');
      expect(useStoryStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchItems', () => {
    it('fetches and sets items (no loading state)', async () => {
      vi.mocked(playthroughApi.listItems).mockResolvedValue([mockItem]);

      await useStoryStore.getState().fetchItems('p1');

      expect(playthroughApi.listItems).toHaveBeenCalledWith('p1');
      expect(useStoryStore.getState().items).toEqual([mockItem]);
    });

    it('logs error on failure, does not throw', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(playthroughApi.listItems).mockRejectedValue(new Error('Fail'));

      await useStoryStore.getState().fetchItems('p1');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('fetchSpecialItems', () => {
    it('fetches and sets specialItems without category', async () => {
      vi.mocked(playthroughApi.listSpecialItems).mockResolvedValue([mockSpecialItem]);

      await useStoryStore.getState().fetchSpecialItems('p1');

      expect(playthroughApi.listSpecialItems).toHaveBeenCalledWith('p1', undefined);
      expect(useStoryStore.getState().specialItems).toEqual([mockSpecialItem]);
    });

    it('fetches and sets specialItems with category', async () => {
      vi.mocked(playthroughApi.listSpecialItems).mockResolvedValue([mockSpecialItem]);

      await useStoryStore.getState().fetchSpecialItems('p1', 'artifact');

      expect(playthroughApi.listSpecialItems).toHaveBeenCalledWith('p1', 'artifact');
      expect(useStoryStore.getState().specialItems).toEqual([mockSpecialItem]);
    });

    it('logs error on failure, does not throw', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(playthroughApi.listSpecialItems).mockRejectedValue(new Error('Fail'));

      await useStoryStore.getState().fetchSpecialItems('p1');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('createCharacter', () => {
    it('sets isLoading true, creates character, adds to array, returns it', async () => {
      vi.mocked(playthroughApi.createCharacter).mockResolvedValue(mockCharacter);

      const promise = useStoryStore.getState().createCharacter('p1', { name: 'Hero', description: 'Brave', role: 'protagonist' });
      expect(useStoryStore.getState().isLoading).toBe(true);

      const result = await promise;

      expect(playthroughApi.createCharacter).toHaveBeenCalledWith('p1', { name: 'Hero', description: 'Brave', role: 'protagonist' });
      expect(result).toEqual(mockCharacter);
      expect(useStoryStore.getState().characters).toEqual([mockCharacter]);
      expect(useStoryStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(playthroughApi.createCharacter).mockRejectedValue(new Error('Fail'));

      await expect(
        useStoryStore.getState().createCharacter('p1', { name: 'X', description: 'Y', role: 'npc' })
      ).rejects.toThrow('Fail');
      expect(useStoryStore.getState().isLoading).toBe(false);
    });
  });

  describe('refreshAll', () => {
    it('sets isLoading true, fetches all data in parallel, sets all state', async () => {
      vi.mocked(playthroughApi.getPlaythrough).mockResolvedValue(mockPlaythrough);
      vi.mocked(playthroughApi.listCharacters).mockResolvedValue([mockCharacter]);
      vi.mocked(playthroughApi.listArcs).mockResolvedValue([mockArc]);
      vi.mocked(playthroughApi.listItems).mockResolvedValue([mockItem]);
      vi.mocked(playthroughApi.listSpecialItems).mockResolvedValue([mockSpecialItem]);

      const promise = useStoryStore.getState().refreshAll('p1');
      expect(useStoryStore.getState().isLoading).toBe(true);
      await promise;

      expect(playthroughApi.getPlaythrough).toHaveBeenCalledWith('p1');
      expect(playthroughApi.listCharacters).toHaveBeenCalledWith('p1');
      expect(playthroughApi.listArcs).toHaveBeenCalledWith('p1');
      expect(playthroughApi.listItems).toHaveBeenCalledWith('p1');
      expect(playthroughApi.listSpecialItems).toHaveBeenCalledWith('p1');

      expect(useStoryStore.getState().currentPlaythrough).toEqual(mockPlaythrough);
      expect(useStoryStore.getState().characters).toEqual([mockCharacter]);
      expect(useStoryStore.getState().arcs).toEqual([mockArc]);
      expect(useStoryStore.getState().items).toEqual([mockItem]);
      expect(useStoryStore.getState().specialItems).toEqual([mockSpecialItem]);
      expect(useStoryStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and rethrows on error', async () => {
      vi.mocked(playthroughApi.getPlaythrough).mockRejectedValue(new Error('Fail'));

      await expect(useStoryStore.getState().refreshAll('p1')).rejects.toThrow('Fail');
      expect(useStoryStore.getState().isLoading).toBe(false);
    });
  });
});
