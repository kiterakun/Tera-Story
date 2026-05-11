import { describe, expect, it, vi } from 'vitest';
import WorldDetailPage from '../../pages/WorldDetailPage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('../../services/playthroughApi', () => ({
  listPlaythroughs: vi.fn().mockResolvedValue([]),
  createPlaythrough: vi.fn(),
  deletePlaythrough: vi.fn(),
}));

vi.mock('../../stores/worldStore', () => ({
  useWorldStore: vi.fn(() => ({
    worlds: [],
    currentWorld: null,
    currentWorldTemplates: [],
    isLoading: false,
    fetchWorlds: vi.fn(),
    fetchWorld: vi.fn().mockResolvedValue(undefined),
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

describe('WorldDetailPage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<WorldDetailPage />, { initialEntries: ['/worlds/world-1'] });

    expect(screen.getByText('World not found')).toBeInTheDocument();
  });
});
