import { describe, expect, it, vi } from 'vitest';
import WorldListPage from '../../pages/WorldListPage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('../../stores/worldStore', () => ({
  useWorldStore: vi.fn(() => ({
    worlds: [],
    currentWorld: null,
    currentWorldTemplates: [],
    isLoading: false,
    fetchWorlds: vi.fn().mockResolvedValue(undefined),
    createFromTemplate: vi.fn(),
    createWorld: vi.fn(),
    updateWorld: vi.fn(),
    deleteWorld: vi.fn(),
  })),
}));

vi.mock('../../stores/settingsStore', () => {
  const state = { settings: { language: 'en' }, isLoading: false };

  return {
    useSettingsStore: vi.fn((selector) => selector(state)),
  };
});

describe('WorldListPage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<WorldListPage />);

    expect(screen.getByText('My Worlds')).toBeInTheDocument();
  });
});
