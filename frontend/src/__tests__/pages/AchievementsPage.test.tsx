import { describe, expect, it, vi, beforeEach } from 'vitest';
import AchievementsPage from '../../pages/AchievementsPage';
import { renderWithRouter, screen } from '../test-utils';

vi.mock('../../hooks/useAchievements', () => ({
  useAchievements: vi.fn(),
}));

import { useAchievements } from '../../hooks/useAchievements';

const mockAchievement = {
  key: 'test_ach',
  name: { en: 'Test', vi: 'Kiểm tra' },
  description: { en: 'Test desc', vi: 'Mô tả' },
  icon: 'star',
  category: 'milestone',
  rarity: 'common',
  hidden: false,
  unlocked: true,
  progress: 1,
  unlockCriteria: { type: 'count', field: 'scenes', threshold: 1 },
  xpReward: 50,
  sortOrder: 1,
};

const defaultMockReturn = {
  achievements: [] as typeof mockAchievement[],
  stats: { total: 0, unlocked: 0, percentComplete: 0 },
  isLoading: true,
  error: null as string | null,
  refetch: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useAchievements).mockReturnValue({ ...defaultMockReturn, refetch: vi.fn() });
});

describe('AchievementsPage', () => {
  it('renders without crashing', () => {
    renderWithRouter(<AchievementsPage />);
    // Loading state renders skeleton placeholders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows loading state with skeleton grid', () => {
    renderWithRouter(<AchievementsPage />);
    // 12 skeleton cards + 1 title skeleton = 13 pulse elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(13);
  });

  it('shows achievements when loaded', () => {
    vi.mocked(useAchievements).mockReturnValue({
      achievements: [mockAchievement],
      stats: { total: 1, unlocked: 1, percentComplete: 100 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<AchievementsPage />);

    // Stats summary
    expect(screen.getByText('Thành Tựu')).toBeInTheDocument();
    expect(screen.getByText('1/1 đã mở khóa — 100% hoàn thành')).toBeInTheDocument();

    // Achievement card visible
    expect(screen.getByText('Kiểm tra')).toBeInTheDocument();
    expect(screen.getByText('Mô tả')).toBeInTheDocument();
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
  });

  it('shows empty state when no achievements', () => {
    vi.mocked(useAchievements).mockReturnValue({
      achievements: [],
      stats: { total: 0, unlocked: 0, percentComplete: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<AchievementsPage />);

    expect(screen.getByText('Chưa có thành tựu nào.')).toBeInTheDocument();
    expect(screen.getByText('Hoàn thành một cảnh truyện để bắt đầu!')).toBeInTheDocument();
  });

  it('shows category filter tabs', () => {
    vi.mocked(useAchievements).mockReturnValue({
      achievements: [mockAchievement],
      stats: { total: 1, unlocked: 1, percentComplete: 100 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<AchievementsPage />);

    // "All" filter + 6 category tabs
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Khám phá' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chiến đấu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sưu tập' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cột mốc' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xã hội' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ẩn' })).toBeInTheDocument();
  });

  it('shows stats summary when achievements loaded', () => {
    vi.mocked(useAchievements).mockReturnValue({
      achievements: [mockAchievement, { ...mockAchievement, key: 'ach_2', unlocked: false }],
      stats: { total: 5, unlocked: 3, percentComplete: 60 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<AchievementsPage />);

    expect(screen.getByText('3/5 đã mở khóa — 60% hoàn thành')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useAchievements).mockReturnValue({
      achievements: [],
      stats: null,
      isLoading: false,
      error: 'Failed to load achievements',
      refetch: mockRefetch,
    });

    renderWithRouter(<AchievementsPage />);

    expect(screen.getByText('Failed to load achievements')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('shows hidden achievement placeholder for locked hidden achievements', () => {
    const hiddenLocked = {
      ...mockAchievement,
      key: 'hidden_one',
      hidden: true,
      unlocked: false,
      progress: 0,
      name: { en: 'Secret', vi: 'Bí mật' },
      description: { en: '???', vi: '???' },
    };

    vi.mocked(useAchievements).mockReturnValue({
      achievements: [hiddenLocked],
      stats: { total: 1, unlocked: 0, percentComplete: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<AchievementsPage />);

    expect(screen.getByText('Thành tựu ẩn')).toBeInTheDocument();
  });
});
