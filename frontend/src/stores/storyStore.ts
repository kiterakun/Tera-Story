import { create } from 'zustand';
import * as playthroughApi from '../services/playthroughApi';
import { Playthrough, Character, Arc } from '../services/playthroughApi';

interface StoryState {
  currentPlaythrough: Playthrough | null;
  characters: Character[];
  arcs: Arc[];
  isLoading: boolean;
  fetchPlaythrough: (id: string) => Promise<void>;
  fetchCharacters: (playthroughId: string) => Promise<void>;
  fetchArcs: (playthroughId: string) => Promise<void>;
  createCharacter: (playthroughId: string, data: { name: string; description: string; role: 'protagonist' | 'npc' }) => Promise<Character>;
}

export const useStoryStore = create<StoryState>((set) => ({
  currentPlaythrough: null,
  characters: [],
  arcs: [],
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
  }
}));
