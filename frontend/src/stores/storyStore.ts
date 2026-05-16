import { create } from 'zustand';
import * as playthroughApi from '../services/playthroughApi';
import * as organizationApi from '../services/organizationApi';
import type { Playthrough, Character, Arc, Item, SpecialItem, Organization } from '../services/playthroughApi';

interface StoryState {
  currentPlaythrough: Playthrough | null;
  characters: Character[];
  arcs: Arc[];
  items: Item[];
  specialItems: SpecialItem[];
  organizations: Organization[];
  isLoading: boolean;
  fetchPlaythrough: (id: string) => Promise<void>;
  fetchCharacters: (playthroughId: string) => Promise<void>;
  fetchArcs: (playthroughId: string) => Promise<void>;
  fetchItems: (playthroughId: string) => Promise<void>;
  fetchSpecialItems: (playthroughId: string, category?: string) => Promise<void>;
  fetchOrganizations: (worldId: string, playthroughId: string) => Promise<void>;
  invalidateCharacters: () => Promise<void>;
  invalidateItems: () => Promise<void>;
  invalidateSpecialItems: () => Promise<void>;
  invalidateOrganizations: () => Promise<void>;
  addOrganization: (org: Organization) => void;
  updateOrganization: (org: Organization) => void;
  createCharacter: (playthroughId: string, data: { name: string; description: string; role: 'protagonist' | 'npc'; background?: string; personality?: string; goals?: string; appearance?: string }) => Promise<Character>;
  refreshAll: (playthroughId: string) => Promise<void>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  currentPlaythrough: null,
  characters: [],
  arcs: [],
  items: [],
  specialItems: [],
  organizations: [],
  isLoading: false,

  fetchPlaythrough: async (id: string) => {
    set({ isLoading: true });
    try {
      const playthrough = await playthroughApi.getPlaythrough(id);
      set({ currentPlaythrough: playthrough, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCharacters: async (playthroughId: string) => {
    set({ isLoading: true });
    try {
      const characters = await playthroughApi.listCharacters(playthroughId);
      set({ characters, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchArcs: async (playthroughId: string) => {
    set({ isLoading: true });
    try {
      const arcs = await playthroughApi.listArcs(playthroughId);
      set({ arcs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchItems: async (playthroughId: string) => {
    try {
      const items = await playthroughApi.listItems(playthroughId);
      set({ items });
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  },

  fetchSpecialItems: async (playthroughId: string, category?: string) => {
    try {
      const specialItems = await playthroughApi.listSpecialItems(playthroughId, category);
      set({ specialItems });
    } catch (error) {
      console.error('Failed to fetch special items:', error);
    }
  },

  invalidateCharacters: async () => {
    const playthroughId = get().currentPlaythrough?._id;
    if (!playthroughId) return;
    await get().fetchCharacters(playthroughId);
  },

  invalidateItems: async () => {
    const playthroughId = get().currentPlaythrough?._id;
    if (!playthroughId) return;
    await get().fetchItems(playthroughId);
  },

  invalidateSpecialItems: async () => {
    const playthroughId = get().currentPlaythrough?._id;
    if (!playthroughId) return;
    await get().fetchSpecialItems(playthroughId);
  },

  fetchOrganizations: async (worldId: string, playthroughId: string) => {
    try {
      const organizations = await organizationApi.listOrganizations(worldId, playthroughId);
      set({ organizations });
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  },

  invalidateOrganizations: async () => {
    const playthrough = get().currentPlaythrough;
    if (!playthrough) return;
    await get().fetchOrganizations(playthrough.worldId, playthrough._id);
  },

  addOrganization: (org: Organization) => {
    set(state => ({ organizations: [...state.organizations, org] }));
  },

  updateOrganization: (org: Organization) => {
    set(state => ({
      organizations: state.organizations.map(o => o._id === org._id ? org : o),
    }));
  },

  createCharacter: async (playthroughId: string, data) => {
    set({ isLoading: true });
    try {
      const newCharacter = await playthroughApi.createCharacter(playthroughId, data);
      set(state => ({ 
        characters: [...state.characters, newCharacter],
        isLoading: false 
      }));
      return newCharacter;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  refreshAll: async (playthroughId: string) => {
    set({ isLoading: true });
    try {
      const [playthrough, characters, arcs, items, specialItems] = await Promise.all([
        playthroughApi.getPlaythrough(playthroughId),
        playthroughApi.listCharacters(playthroughId),
        playthroughApi.listArcs(playthroughId),
        playthroughApi.listItems(playthroughId),
        playthroughApi.listSpecialItems(playthroughId),
      ]);
      set({ currentPlaythrough: playthrough, characters, arcs, items, specialItems, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
