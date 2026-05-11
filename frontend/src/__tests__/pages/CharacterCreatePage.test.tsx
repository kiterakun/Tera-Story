import { describe, expect, it, vi } from 'vitest';
import CharacterCreatePage from '../../pages/CharacterCreatePage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('../../services/supportApi', () => ({
  default: {},
  enrichCharacterDescription: vi.fn(),
}));

vi.mock('../../stores/storyStore', () => {
  const state = {
    currentPlaythrough: null,
    characters: [],
    arcs: [],
    items: [],
    specialItems: [],
    isLoading: false,
    fetchPlaythrough: vi.fn(),
    fetchCharacters: vi.fn(),
    fetchArcs: vi.fn(),
    fetchItems: vi.fn(),
    fetchSpecialItems: vi.fn(),
    createCharacter: vi.fn().mockResolvedValue({}),
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

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    characterCreate: {
      title: 'Create Character',
      nameLabel: 'Name',
      namePlaceholder: 'Enter character name',
      nameRequired: 'Name is required',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Describe your character',
      roleLabel: 'Role',
      protagonist: 'Protagonist',
      npc: 'NPC',
      statsNote: 'Stats will be assigned based on world templates.',
      forgeCharacter: 'Forge Character',
      forging: 'Forging...',
      cancel: 'Cancel',
      enrichPrompt: 'Enrich with AI',
      enriching: 'Enriching...',
    },
  }),
}));

describe('CharacterCreatePage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<CharacterCreatePage />, {
      initialEntries: ['/worlds/world-1/playthroughs/playthrough-1/characters/create'],
    });

    expect(screen.getByText('Create Character')).toBeInTheDocument();
  });
});
