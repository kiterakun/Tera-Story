import { describe, expect, it, vi } from 'vitest';
import PlaythroughPage from '../../pages/PlaythroughPage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('../../services/playthroughApi', () => ({
  deletePlaythrough: vi.fn(),
}));

vi.mock('../../stores/storyStore', () => {
  const state = {
    currentPlaythrough: null,
    characters: [],
    arcs: [],
    items: [],
    specialItems: [],
    isLoading: false,
    fetchPlaythrough: vi.fn().mockResolvedValue(undefined),
    fetchCharacters: vi.fn().mockResolvedValue(undefined),
    fetchArcs: vi.fn().mockResolvedValue(undefined),
    fetchItems: vi.fn().mockResolvedValue(undefined),
    fetchSpecialItems: vi.fn().mockResolvedValue(undefined),
    createCharacter: vi.fn(),
    refreshAll: vi.fn(),
  };

  return {
    useStoryStore: vi.fn((selector) => selector(state)),
  };
});

vi.mock('../../stores/settingsStore', () => {
  const state = { settings: { language: 'en' }, isLoading: false };

  return {
    useSettingsStore: vi.fn((selector) => selector(state)),
  };
});

describe('PlaythroughPage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<PlaythroughPage />, { initialEntries: ['/worlds/world-1/playthroughs/playthrough-1'] });

    expect(screen.getByText('Playthrough not found')).toBeInTheDocument();
  });
});
