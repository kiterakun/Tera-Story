import { describe, expect, it, vi } from 'vitest';
import StoryReaderPage from '../../pages/StoryReaderPage';
import { renderWithRouter, screen } from '../test-utils';

// Mock router params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useParams: () => ({ playthroughId: 'test-playthrough-id' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock('../../hooks/useChapterGeneration', () => ({
  useChapterGeneration: () => ({
    isGenerating: false,
    isRetryingTools: false,
    isStreaming: false,
    streamingText: '',
    streamPhase: null,
    error: null,
    generateChapter: vi.fn(),
    generateChapterStream: vi.fn(),
    retryChapter: vi.fn(),
    retryTools: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../../hooks/useSSE', () => ({
  useSSE: () => ({ isConnected: false }),
}));

vi.mock('../../services/storyApi', () => ({
  getStoryState: vi.fn().mockResolvedValue({ chapters: [], choices: [], isNewGame: false }),
  summarizeArc: vi.fn(),
}));

vi.mock('../../services/playthroughApi', () => ({
  listRelationships: vi.fn().mockResolvedValue([]),
  listConsequences: vi.fn().mockResolvedValue([]),
  getActiveCombat: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../components/StoryContent', () => ({
  StoryContent: () => <div>StoryContent</div>,
}));
vi.mock('../../components/ChoiceCards', () => ({
  ChoiceCards: () => <div>ChoiceCards</div>,
}));
vi.mock('../../components/CombatPanel', () => ({
  CombatPanel: () => <div>CombatPanel</div>,
}));
vi.mock('../../components/EntityDetailModal', () => ({
  EntityDetailModal: () => <div>EntityDetailModal</div>,
}));
vi.mock('../../components/LoadingSkeleton', () => ({
  LoadingSkeleton: () => <div>Loading...</div>,
}));
vi.mock('../../components/RelationshipWebModal', () => ({
  RelationshipWebModal: () => <div>RelationshipWebModal</div>,
}));
vi.mock('../../components/ConsequenceFlashback', () => ({
  ConsequenceFlashback: () => <div>ConsequenceFlashback</div>,
}));
vi.mock('../../components/RetryImageButton', () => ({
  RetryImageButton: () => <div>RetryImageButton</div>,
}));
vi.mock('../../components/StoryNavigation', () => ({
  StoryNavigation: () => <div>StoryNavigation</div>,
}));
vi.mock('../../components/TypewriterText', () => ({
  TypewriterText: () => <span>typewriter</span>,
}));

vi.mock('../../utils/url', () => ({
  getImageUrl: (path: string) => path,
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

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    storyReader: {
      title: 'Story Reader',
      statsTab: 'Stats',
      inventoryTab: 'Inventory',
      abilitiesTab: 'Abilities',
      relationshipsTab: 'Relationships',
      noCharacters: 'No characters',
      noRelationships: 'No relationships',
      generationFailed: 'Generation failed',
      generationFailedHint: 'Try again',
      retryGeneration: 'Retry',
      updatingGameState: 'Updating...',
      toolsFailedTitle: 'Tools failed',
      toolsFailedHint: 'Retry tools',
      retryTools: 'Retry tools',
      confirmSummarize: 'Summarize arc?',
      chapterNav: 'Chapters',
      beginStory: 'Begin Story',
    },
    toast: {
      arcSummarized: 'Arc summarized',
      arcSummarizeFailed: 'Arc summarize failed',
    },
    characterPanel: {
      protagonist: 'Protagonist',
      storyCharacters: 'Characters',
    },
    relationship: {},
  }),
}));

describe('StoryReaderPage smoke test', () => {
  it('renders without crashing', () => {
    renderWithRouter(<StoryReaderPage />, {
      initialEntries: ['/playthroughs/test-playthrough-id/read'],
    });

    // The page shows LoadingSkeleton initially (isLoadingState starts true)
    // Our mock LoadingSkeleton renders "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
