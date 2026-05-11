import { describe, expect, it, vi } from 'vitest';
import SettingsPage from '../../pages/SettingsPage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('../../stores/settingsStore', () => {
  const state = {
    settings: {
      language: 'en',
      theme: 'dark',
      aiSettings: {
        contextAgent: { provider: 'openai', model: 'gpt-4o', baseUrl: '', apiKey: '' },
        writerAgent: { provider: 'openai', model: 'gpt-4o', baseUrl: '', apiKey: '' },
        supportAgent: { provider: 'openai', model: 'gpt-4o', baseUrl: '', apiKey: '' },
        imageAgent: { provider: 'openai', model: 'dall-e-3', baseUrl: '', apiKey: '' },
      },
    },
    isLoading: false,
    fetchSettings: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn(),
    updateAIConfig: vi.fn(),
  };

  return {
    useSettingsStore: vi.fn((selector) => {
      if (typeof selector === 'function') return selector(state);
      return state;
    }),
  };
});

vi.mock('../../stores/uiStore', () => {
  const state = {
    theme: 'dark',
    sidebarOpen: false,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    toggleSidebar: vi.fn(),
    setSidebarOpen: vi.fn(),
  };

  return {
    useUIStore: vi.fn((selector) => {
      if (typeof selector === 'function') return selector(state);
      return state;
    }),
    AppTheme: {},
  };
});

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    settings: {
      title: 'Settings',
      general: 'General',
      language: 'Language',
      themeLabel: 'Theme',
      themeDark: 'Dark',
      themeLight: 'Light',
      themeCyberpunk: 'Cyberpunk',
      themeSepia: 'Sepia',
      themeAbyssal: 'Abyssal',
      saveGeneral: 'Save',
      saving: 'Saving...',
      aiConfig: 'AI Configuration',
      aiConfigDesc: 'Configure AI providers',
      provider: 'Provider',
      model: 'Model',
      baseUrl: 'Base URL',
      apiKey: 'API Key',
      save: 'Save',
      saved: 'Saved',
      maskedKey: '****',
    },
    toast: {
      settingsSaved: 'Settings saved',
      aiConfigSaved: 'AI config saved',
      settingsSaveFailed: 'Save failed',
    },
  }),
  persistLanguage: vi.fn(),
}));

describe('SettingsPage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
