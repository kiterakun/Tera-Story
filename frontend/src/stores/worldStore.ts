import { create } from 'zustand';
import * as worldApi from '../services/worldApi';
import type { World, SpecialItemTemplate, MapData } from '../services/worldApi';

interface WorldState {
  worlds: World[];
  currentWorld: World | null;
  currentWorldTemplates: SpecialItemTemplate[];
  isLoading: boolean;
  fetchWorlds: () => Promise<void>;
  fetchWorld: (id: string) => Promise<void>;
  createWorld: (data: Partial<World> & { specialItemTemplates?: SpecialItemTemplate[] }) => Promise<{ world: World; mapData?: MapData }>;
  createFromTemplate: (templateId: string, name: string) => Promise<World>;
  updateWorld: (id: string, data: Partial<World>) => Promise<World>;
  deleteWorld: (id: string) => Promise<void>;
}

export const useWorldStore = create<WorldState>()((set) => ({
  worlds: [],
  currentWorld: null,
  currentWorldTemplates: [],
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
      const { world, specialItemTemplates } = await worldApi.getWorld(id);
      set({ currentWorld: world, currentWorldTemplates: specialItemTemplates, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createWorld: async (data: Partial<World> & { specialItemTemplates?: SpecialItemTemplate[] }) => {
    set({ isLoading: true });
    try {
      const { world: newWorld, mapData } = await worldApi.createWorld(data);
      set((state) => ({ 
        worlds: [...state.worlds, newWorld], 
        isLoading: false 
      }));
      return { world: newWorld, mapData };
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createFromTemplate: async (templateId: string, name: string) => {
    set({ isLoading: true });
    try {
      const { world: newWorld } = await worldApi.createFromTemplate(templateId, name);
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
        currentWorldTemplates: state.currentWorld?._id === id ? [] : state.currentWorldTemplates,
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
