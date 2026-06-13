import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { CharacterPanel } from '../../components/CharacterPanel';

vi.mock('../../services/api', () => ({
  api: { post: vi.fn() },
}));

describe('CharacterPanel', () => {
  const protagonist = {
    _id: 'c1',
    name: 'Linh',
    description: 'A careful scout.',
    role: 'protagonist' as const,
    dynamicStats: [],
  };
  const npcs = [
    { _id: 'n1', name: 'Quang', description: 'Old friend.', role: 'npc' as const, dynamicStats: [] },
  ];

  it('opens the drawer when the toggle is clicked', () => {
    render(<CharacterPanel protagonist={protagonist} npcs={npcs} resourceTemplates={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng nhân vật' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has no axe a11y violations when open', async () => {
    const { container } = render(<CharacterPanel protagonist={protagonist} npcs={npcs} resourceTemplates={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng nhân vật' }));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
