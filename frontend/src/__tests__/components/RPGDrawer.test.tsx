import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { RPGDrawer } from '../../components/RPGDrawer';

vi.mock('../../stores/storyStore', () => ({
  useStoryStore: () => ({ world: undefined, specialItemTemplates: [] }),
}));

const baseProps = {
  open: true,
  onClose: () => undefined,
  rpgTab: 'stats' as const,
  setRpgTab: () => undefined,
  tabLabels: { stats: 'Thống kê', inventory: 'Hành trang', abilities: 'Kỹ năng', relations: 'Quan hệ' },
  protagonist: null,
  sortedNpcs: [],
  sortedItems: [],
  sortedSpecialItems: [],
  characters: [],
  relationships: [],
  setDetailEntity: () => undefined,
  setIsRelationshipModalOpen: () => undefined,
  isRelationshipModalOpen: false,
};

describe('RPGDrawer', () => {
  it('renders the RPG panel inside a Drawer primitive', () => {
    render(<RPGDrawer {...baseProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has no axe a11y violations', async () => {
    const { container } = render(<RPGDrawer {...baseProps} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('forwards onClose to the Drawer', () => {
    const onClose = vi.fn();
    render(<RPGDrawer {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
