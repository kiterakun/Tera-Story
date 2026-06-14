import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryInspector } from '../../../components/story-reader/MemoryInspector';

function mockFetchOnce(data: unknown, status = 200) {
  return vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

const SAMPLE = {
  status: 'success',
  data: {
    characters: [{ _id: 'c1', name: 'Alice', role: 'protagonist', status: 'active' }],
    items: [{ _id: 'i1', name: 'Sword of Light', rarity: 'rare' }],
    specialItems: [{ _id: 's1', name: 'Ember', category: 'abilities' }],
    organizations: [{ _id: 'o1', name: 'Archivists', status: 'active' }],
    currentLocation: { _id: 'l1', name: 'Glass Meridian', description: 'A floating city.' },
  },
};

describe('MemoryInspector', () => {
  it('renders the snapshot groups with counts', async () => {
    const fetchSpy = mockFetchOnce(SAMPLE);
    vi.stubGlobal('fetch', fetchSpy);

    render(<MemoryInspector playthroughId="p1" />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    // Items/SpecialItems/Organizations groups are collapsed by default.
    // Open them to verify the second entity.
    const itemsBtn = screen.getAllByRole('button').find((b) => b.textContent?.startsWith('Items'));
    fireEvent.click(itemsBtn!);
    expect(screen.getByText('Sword of Light')).toBeInTheDocument();

    const siBtn = screen.getAllByRole('button').find((b) => b.textContent?.startsWith('Special items'));
    fireEvent.click(siBtn!);
    expect(screen.getByText('Ember')).toBeInTheDocument();

    const orgBtn = screen.getAllByRole('button').find((b) => b.textContent?.startsWith('Organizations'));
    fireEvent.click(orgBtn!);
    expect(screen.getByText('Archivists')).toBeInTheDocument();

    const locBtn = screen.getAllByRole('button').find((b) => b.textContent?.startsWith('Current location'));
    fireEvent.click(locBtn!);
    expect(screen.getByText('Glass Meridian')).toBeInTheDocument();

    // Verify counts are shown in group labels (parenthetical numbers).
    expect(screen.getAllByText('(1)').length).toBeGreaterThanOrEqual(1);
    vi.unstubAllGlobals();
  });

  it('shows empty state when fetch returns no data', async () => {
    const fetchSpy = mockFetchOnce({ status: 'error' });
    vi.stubGlobal('fetch', fetchSpy);

    render(<MemoryInspector playthroughId="p1" />);
    await waitFor(() => {
      expect(screen.getByText(/Chưa có thực thể/i)).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });
});
