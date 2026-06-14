import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DirectorPanel } from '../../../components/story-reader/DirectorPanel';
import { DEFAULT_DIRECTOR } from '../../../components/story-reader/directorModel';

function mockFetchOnce(data: unknown, status = 200) {
  return vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

describe('DirectorPanel', () => {
  it('renders sliders and segmented controls from fetched director', async () => {
    const fetchSpy = mockFetchOnce({
      status: 'success',
      data: { director: { tone: 'whimsical', danger: 80, romance: 10, comedy: 90, pacing: 'fast' } },
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(<DirectorPanel playthroughId="p1" />);

    await waitFor(() => {
      expect(screen.getByRole('slider', { name: /Nguy hiểm/i })).toHaveValue('80');
    });
    expect(screen.getByRole('slider', { name: /Lãng mạn/i })).toHaveValue('10');
    expect(screen.getByRole('slider', { name: /Hài hước/i })).toHaveValue('90');
    expect(screen.getByRole('button', { name: /Hài hước/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Nhanh/i })).toHaveAttribute('aria-pressed', 'true');

    vi.unstubAllGlobals();
  });

  it('falls back to defaults when fetch fails', async () => {
    const fetchSpy = mockFetchOnce({ status: 'error' });
    vi.stubGlobal('fetch', fetchSpy);

    render(<DirectorPanel playthroughId="p1" />);

    await waitFor(() => {
      expect(screen.getByRole('slider', { name: /Nguy hiểm/i })).toHaveValue(
        String(DEFAULT_DIRECTOR.danger),
      );
    });
    vi.unstubAllGlobals();
  });

  it('reset button restores defaults', async () => {
    const fetchSpy = mockFetchOnce({
      status: 'success',
      data: { director: { ...DEFAULT_DIRECTOR, danger: 99 } },
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(<DirectorPanel playthroughId="p1" />);
    await waitFor(() => {
      expect(screen.getByRole('slider', { name: /Nguy hiểm/i })).toHaveValue('99');
    });
    fireEvent.click(screen.getByRole('button', { name: /Khôi phục mặc định/i }));
    expect(screen.getByRole('slider', { name: /Nguy hiểm/i })).toHaveValue(
      String(DEFAULT_DIRECTOR.danger),
    );
    vi.unstubAllGlobals();
  });
});
