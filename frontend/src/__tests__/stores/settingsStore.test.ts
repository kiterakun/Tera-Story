import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../../stores/settingsStore';

vi.mock('../../services/settingsApi', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  updateAIConfig: vi.fn(),
}));

import * as settingsApi from '../../services/settingsApi';

const mockSettings = {
  language: 'en',
  theme: 'dark' as const,
  aiSettings: {
    contextAgent: { provider: 'openai' as const, model: 'gpt-4' },
    writerAgent: { provider: 'openai' as const, model: 'gpt-4' },
    supportAgent: { provider: 'openai' as const, model: 'gpt-4' },
    imageAgent: { provider: 'openai' as const, model: 'dall-e-3' },
  },
};

const initialState = { settings: null, isLoading: false };

beforeEach(() => {
  useSettingsStore.setState(initialState);
  vi.clearAllMocks();
});

describe('settingsStore', () => {
  describe('initial state', () => {
    it('has null settings', () => {
      expect(useSettingsStore.getState().settings).toBeNull();
    });
    it('has isLoading false', () => {
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchSettings', () => {
    it('sets isLoading true, fetches, sets settings', async () => {
      vi.mocked(settingsApi.getSettings).mockResolvedValue(mockSettings);

      const promise = useSettingsStore.getState().fetchSettings();
      expect(useSettingsStore.getState().isLoading).toBe(true);
      await promise;

      expect(settingsApi.getSettings).toHaveBeenCalled();
      expect(useSettingsStore.getState().settings).toEqual(mockSettings);
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false and logs error on failure, does not rethrow', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(settingsApi.getSettings).mockRejectedValue(new Error('Fail'));

      await useSettingsStore.getState().fetchSettings();

      expect(useSettingsStore.getState().isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('updateSettings', () => {
    it('sets isLoading true, calls API, sets updated settings', async () => {
      const updated = { ...mockSettings, language: 'vi' };
      vi.mocked(settingsApi.updateSettings).mockResolvedValue(updated);

      const promise = useSettingsStore.getState().updateSettings({ language: 'vi' });
      expect(useSettingsStore.getState().isLoading).toBe(true);
      await promise;

      expect(settingsApi.updateSettings).toHaveBeenCalledWith({ language: 'vi' });
      expect(useSettingsStore.getState().settings).toEqual(updated);
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false, logs error, and rethrows on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(settingsApi.updateSettings).mockRejectedValue(new Error('Fail'));

      await expect(useSettingsStore.getState().updateSettings({ language: 'vi' })).rejects.toThrow('Fail');

      expect(useSettingsStore.getState().isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('updateAIConfig', () => {
    it('returns early when settings is null', async () => {
      await useSettingsStore.getState().updateAIConfig('writerAgent', { model: 'gpt-5' });

      expect(settingsApi.updateAIConfig).not.toHaveBeenCalled();
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading true, merges config, calls API, sets updated settings', async () => {
      useSettingsStore.setState({ settings: mockSettings });
      const updated = { ...mockSettings, aiSettings: { ...mockSettings.aiSettings, writerAgent: { provider: 'openai' as const, model: 'gpt-5' } } };
      vi.mocked(settingsApi.updateAIConfig).mockResolvedValue(updated);

      const promise = useSettingsStore.getState().updateAIConfig('writerAgent', { model: 'gpt-5' });
      expect(useSettingsStore.getState().isLoading).toBe(true);
      await promise;

      expect(settingsApi.updateAIConfig).toHaveBeenCalledWith({
        writerAgent: { provider: 'openai', model: 'gpt-5' },
      });
      expect(useSettingsStore.getState().settings).toEqual(updated);
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading false, logs error, and rethrows on failure', async () => {
      useSettingsStore.setState({ settings: mockSettings });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(settingsApi.updateAIConfig).mockRejectedValue(new Error('Fail'));

      await expect(
        useSettingsStore.getState().updateAIConfig('writerAgent', { model: 'bad' })
      ).rejects.toThrow('Fail');

      expect(useSettingsStore.getState().isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
