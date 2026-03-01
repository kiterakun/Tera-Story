import { create } from 'zustand';
import * as worldApi from '../services/worldApi';
import { World } from '../services/worldApi';

interface WorldState {
  worlds: World[];
  currentWorld: World | null;
  isLoading: boolean;
  fetchWorlds: () => Promise<void>;
  fetchWorld: (id: string) => Promise<void>;
  createWorld: (data: Partial<World>) => Promise<World>;
  createFromTemplate: (templateId: string, name: string) => Promise<World>;
  updateWorld: (id: string, data: Partial<World>) => Promise<World>;
  deleteWorld: (id: string) => Promise<void>;
}

export const useWorldStore = create<WorldState>()((set, get) => ({
  worlds: [],
  currentWorld: null,
  isLoading: false,

  fetchWorlds: async () => {
    set({ isLoading: true });
    try {
      const worlds = await worldApi.listWorlds();
      set({ worlds, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchWorld: async (id: string) => {
    set({ isLoading: true });
    try {
      const world = await worldApi.getWorld(id);
      set({ currentWorld: world, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createWorld: async (data: Partial<World>) => {
    set({ isLoading: true });
    try {
      const newWorld = await worldApi.createWorld(data);
      set((state) => ({ 
        worlds: [...state.worlds, newWorld],
        isLoading: false 
      }));
      return newWorld;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createFromTemplate: async (templateId: string, name: string) => {
    set({ isLoading: true });
    try {
      const newWorld = await worldApi.createFromTemplate(templateId, name);
      set((state) => ({ 
        worlds: [...state.worlds, newWorld],
        isLoading: false 
      }));
      return newWorld;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateWorld: async (id: string, data: Partial<World>) => {
    set({ isLoading: true });
    try {
      const updatedWorld = await worldApi.updateWorld(id, data);
      set((state) => ({
        worlds: state.worlds.map((w) => (w._id === id ? updatedWorld : w)),
        currentWorld: state.currentWorld?._id === id ? updatedWorld : state.currentWorld,
        isLoading: false
      }));
      return updatedWorld;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteWorld: async (id: string) => {
    set({ isLoading: true });
    try {
      await worldApi.deleteWorld(id);
      set((state) => ({
        worlds: state.worlds.filter((w) => w._id !== id),
        currentWorld: state.currentWorld?._id === id ? null : state.currentWorld,
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
