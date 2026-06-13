import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RelationshipWebModal } from '../../components/RelationshipWebModal';
import { RELATIONSHIP_TYPE_COLORS } from '../../design-system/colors';

vi.mock('react-force-graph-2d', () => ({
  default: () => <div data-testid="force-graph-stub" />,
}));

const chars = [
  { _id: 'a', name: 'Linh', description: '', role: 'protagonist' as const, status: 'active' as const, dynamicStats: [], background: '', personality: '', goals: '', appearance: '', playthroughId: 'p', worldId: 'w', userId: 'u', createdAt: '', updatedAt: '' },
  { _id: 'b', name: 'Quang', description: '', role: 'npc' as const, status: 'active' as const, dynamicStats: [], background: '', personality: '', goals: '', appearance: '', playthroughId: 'p', worldId: 'w', userId: 'u', createdAt: '', updatedAt: '' },
  { _id: 'c', name: 'Mai', description: '', role: 'npc' as const, status: 'active' as const, dynamicStats: [], background: '', personality: '', goals: '', appearance: '', playthroughId: 'p', worldId: 'w', userId: 'u', createdAt: '', updatedAt: '' },
];
const rels = [
  { _id: 'r1', characterA: chars[0], characterB: chars[1], type: 'ally' as const, intensity: 5, createdAt: '' },
  { _id: 'r2', characterA: chars[1], characterB: chars[2], type: 'rival' as const, intensity: 4, createdAt: '' },
];

describe('RelationshipWebModal', () => {
  it('renders a listbox with character options', () => {
    render(<RelationshipWebModal isOpen onClose={() => undefined} relationships={rels} characters={chars} />);
    expect(screen.getByRole('listbox', { name: 'Character navigation' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Linh' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Quang' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mai' })).toBeInTheDocument();
  });

  it('supports arrow key navigation between characters', () => {
    render(<RelationshipWebModal isOpen onClose={() => undefined} relationships={rels} characters={chars} />);
    const listbox = screen.getByRole('listbox', { name: 'Character navigation' });
    const linh = screen.getByRole('option', { name: 'Linh' });
    const quang = screen.getByRole('option', { name: 'Quang' });
    const mai = screen.getByRole('option', { name: 'Mai' });
    expect(linh).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(quang).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(mai).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    expect(quang).toHaveAttribute('aria-selected', 'true');
  });

  it('supports Home and End keys', () => {
    render(<RelationshipWebModal isOpen onClose={() => undefined} relationships={rels} characters={chars} />);
    const listbox = screen.getByRole('listbox', { name: 'Character navigation' });
    const linh = screen.getByRole('option', { name: 'Linh' });
    const mai = screen.getByRole('option', { name: 'Mai' });
    fireEvent.keyDown(listbox, { key: 'End' });
    expect(mai).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(linh).toHaveAttribute('aria-selected', 'true');
  });

  it('renders a legend for every relationship type token', () => {
    render(<RelationshipWebModal isOpen onClose={() => undefined} relationships={rels} characters={chars} />);
    expect(screen.getByText('Legend')).toBeInTheDocument();
    const items = screen.getAllByTestId('relationship-legend-item');
    expect(items.length).toBe(Object.keys(RELATIONSHIP_TYPE_COLORS).length);
  });
});
