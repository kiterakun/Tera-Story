import { describe, expect, it, vi } from 'vitest';
import WorldCreatePage from '../../pages/WorldCreatePage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('../../services/supportApi', () => ({
  generateWorld: vi.fn(),
}));

vi.mock('../../stores/worldStore', () => ({
  useWorldStore: vi.fn(() => ({
    worlds: [],
    currentWorld: null,
    currentWorldTemplates: [],
    isLoading: false,
    fetchWorlds: vi.fn(),
    fetchWorld: vi.fn(),
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

describe('WorldCreatePage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<WorldCreatePage />);

    expect(screen.getByText('Forge New World')).toBeInTheDocument();
  });
});
