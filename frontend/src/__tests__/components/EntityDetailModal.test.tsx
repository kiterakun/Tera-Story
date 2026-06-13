import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { EntityDetailModal, type EntityData } from '../../components/EntityDetailModal';

vi.mock('../../stores/storyStore', () => ({
  useStoryStore: (selector?: (s: unknown) => unknown) => {
    const state = { world: undefined, specialItemTemplates: [] };
    return selector ? selector(state) : state;
  },
}));

const baseChar: EntityData = {
  type: 'character',
  data: {
    _id: 'c1',
    name: 'Linh',
    description: 'A careful scout.',
    imageUrl: undefined,
    role: 'protagonist',
    status: 'active',
    dynamicStats: [],
    background: 'A wandering scholar.',
    personality: 'Curious, cautious.',
    goals: 'Find the lost library.',
    appearance: 'Wears a faded blue coat.',
    playthroughId: 'p1',
    worldId: 'w1',
    userId: 'u1',
    createdAt: '',
    updatedAt: '',
  },
};

const baseItem: EntityData = {
  type: 'item',
  data: {
    _id: 'i1',
    name: 'Moon Blade',
    description: 'A blade forged under a moon.',
    rarity: 'legendary',
    status: 'active',
    properties: { weight: 3, dmg: 12 },
    playthroughId: 'p1',
    createdAt: '',
  },
};

const baseSpecial: EntityData = {
  type: 'special',
  data: {
    _id: 's1',
    name: 'Sealed Oath',
    description: 'A bound promise.',
    category: 'Relic',
    rarity: 'rare',
    status: 'active',
    customFields: { cost: '5 mana' },
    playthroughId: 'p1',
    createdAt: '',
  },
};

const baseOrg: EntityData = {
  type: 'organization',
  data: {
    _id: 'o1',
    name: 'Hidden Gate',
    description: 'A secret order.',
    type: 'cult',
    status: 'active',
    goals: 'Restore balance.',
    structure: 'Council of 5.',
    dynamicStats: [],
    memberIds: ['Member A', 'Member B'],
    playthroughId: 'p1',
    worldId: 'w1',
    createdAt: '',
  },
};

describe('EntityDetailModal', () => {
  it('renders nothing when entity is null', () => {
    const { container } = render(<EntityDetailModal entity={null} onClose={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders character details with name and description', () => {
    render(<EntityDetailModal entity={baseChar} onClose={() => undefined} />);
    expect(screen.getAllByText('Linh').length).toBeGreaterThan(0);
    expect(screen.getByText('A careful scout.')).toBeInTheDocument();
  });

  it('renders item details with rarity label', () => {
    render(<EntityDetailModal entity={baseItem} onClose={() => undefined} />);
    expect(screen.getAllByText('Moon Blade').length).toBeGreaterThan(0);
    expect(screen.getByText('Huyền thoại')).toBeInTheDocument();
    expect(screen.getByText('weight')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders special item details with category subtitle', () => {
    render(<EntityDetailModal entity={baseSpecial} onClose={() => undefined} />);
    expect(screen.getAllByText('Sealed Oath').length).toBeGreaterThan(0);
    expect(screen.getByText('Relic')).toBeInTheDocument();
  });

  it('renders organization details with members', () => {
    render(<EntityDetailModal entity={baseOrg} onClose={() => undefined} />);
    expect(screen.getAllByText('Hidden Gate').length).toBeGreaterThan(0);
    expect(screen.getByText('Member A')).toBeInTheDocument();
    expect(screen.getByText('Member B')).toBeInTheDocument();
  });

  it('calls onClose when the modal is dismissed', () => {
    const onClose = vi.fn();
    render(<EntityDetailModal entity={baseChar} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('has no axe a11y violations for character variant', async () => {
    const { container } = render(<EntityDetailModal entity={baseChar} onClose={() => undefined} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
