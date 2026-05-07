import { create } from 'zustand';
import * as settingsApi from '../services/settingsApi';

export interface AgentConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface AISettings {
  contextAgent: AgentConfig;
  writerAgent: AgentConfig;
  supportAgent: AgentConfig;
  imageAgent: AgentConfig;
}

export interface UserSettings {
  language: string;
  theme: string;
  aiSettings?: AISettings;
}

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  updateAIConfig: (agent: keyof AISettings, config: Partial<AgentConfig>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: null,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const data = await settingsApi.getSettings();
      set({ settings: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch settings:', error);
    }
  },
  updateSettings: async (data) => {
    set({ isLoading: true });
    try {
      const updated = await settingsApi.updateSettings(data);
      set({ settings: updated, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to update settings:', error);
      throw error;
    }
  },
  updateAIConfig: async (agent, config) => {
    set({ isLoading: true });
    const currentSettings = get().settings;
    if (!currentSettings) {
      set({ isLoading: false });
      return;
    }

    const payload = {
      [agent]: {
        ...currentSettings.aiSettings?.[agent],
        ...config
      }
    };

    try {
      // Expecting PUT /api/settings/ai with the specific agent payload to be handled correctly on backend
      const updated = await settingsApi.updateAIConfig(payload);
      set({ settings: updated, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to update AI config:', error);
      throw error;
    }
  }
}));
