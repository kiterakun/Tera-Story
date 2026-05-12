import { describe, expect, it, vi, beforeEach } from 'vitest';
import ChroniclePage from '../../pages/ChroniclePage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ playthroughId: 'test-playthrough-123' }),
  };
});

vi.mock('../../hooks/useChronicle', () => ({
  useChronicle: vi.fn(),
}));

import { useChronicle } from '../../hooks/useChronicle';

const mockChronicleData = {
  playthroughName: 'Test Adventure',
  worldId: 'world1',
  status: 'active',
  chronicle: {
    generatedAt: new Date().toISOString(),
    arcSummaries: [
      {
        arcId: 'arc1',
        title: 'The Beginning',
        summary: 'A journey starts',
        sceneCount: 3,
        keyScenes: [],
      },
    ],
    stats: {
      totalScenes: 3,
      totalChoices: 5,
      totalCombats: 1,
      totalPlayTimeMinutes: 60,
    },
  },
  completedAt: null,
};

const defaultMockReturn = {
  chronicle: null,
  isLoading: true,
  error: null,
  refetch: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useChronicle).mockReturnValue({ ...defaultMockReturn, refetch: vi.fn() });
});

describe('ChroniclePage', () => {
  it('renders without crashing', () => {
    renderWithRouter(<ChroniclePage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton', () => {
    renderWithRouter(<ChroniclePage />);
    // ChronicleSkeleton: 1 title + 4 arcs × 4 elements each = 17 pulse elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(17);
  });

  it('shows chronicle data with arcs and stats when loaded', () => {
    vi.mocked(useChronicle).mockReturnValue({
      chronicle: mockChronicleData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<ChroniclePage />);

    // Playthrough name
    expect(screen.getByText('Test Adventure')).toBeInTheDocument();
    // Status
    expect(screen.getByText('Đang tiến hành')).toBeInTheDocument();
    // Share button
    expect(screen.getByText('Chia sẻ')).toBeInTheDocument();
    // Arc title
    expect(screen.getByText(/Arc 1: The Beginning/)).toBeInTheDocument();
    // Arc summary
    expect(screen.getByText('A journey starts')).toBeInTheDocument();
    // Scene count badge
    expect(screen.getByText('3 cảnh')).toBeInTheDocument();
    // Stat labels
    expect(screen.getByText('Cảnh')).toBeInTheDocument();
    expect(screen.getByText('Lựa chọn')).toBeInTheDocument();
    expect(screen.getByText('Trận chiến')).toBeInTheDocument();
    expect(screen.getByText('Thời gian')).toBeInTheDocument();
    // Unique stat values (5 and 60p are unambiguous)
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('60p')).toBeInTheDocument();
  });

  it('shows empty state when no chronicle', () => {
    vi.mocked(useChronicle).mockReturnValue({
      chronicle: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<ChroniclePage />);

    expect(screen.getByText('Hành trình của bạn đang bắt đầu...')).toBeInTheDocument();
    expect(screen.getByText('Hoàn thành các cảnh truyện để xem biên niên sử.')).toBeInTheDocument();
  });

  it('shows share button when chronicle is loaded', () => {
    vi.mocked(useChronicle).mockReturnValue({
      chronicle: mockChronicleData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<ChroniclePage />);

    const shareButton = screen.getByText('Chia sẻ');
    expect(shareButton).toBeInTheDocument();
    expect(shareButton.closest('button')).not.toBeNull();
  });
});
