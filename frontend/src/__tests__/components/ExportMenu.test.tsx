import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ExportMenu } from '../../components/ExportMenu';

vi.mock('../../lib/toast', () => ({
  showError: vi.fn(),
}));

const mockResponse = (ok: boolean) =>
  ({
    ok,
    blob: () => Promise.resolve(new Blob(['x'], { type: 'text/plain' })),
  }) as unknown as Response;

describe('ExportMenu', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // jsdom lacks URL.createObjectURL / revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders three export buttons (PDF, Markdown, ePub)', () => {
    render(<ExportMenu playthroughId="p1" />);
    expect(screen.getByRole('button', { name: /PDF/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Markdown/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ePub/ })).toBeInTheDocument();
  });

  it('calls export endpoint with chosen format and downloads', async () => {
    const fetchMock = vi.fn<[], Promise<Response>>().mockResolvedValue(mockResponse(true));
    vi.stubGlobal('fetch', fetchMock);

    render(<ExportMenu playthroughId="p1" />);
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/playthroughs/p1/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' }),
      });
    });
  });

  it('disables all buttons while one is in flight', async () => {
    let resolveFetch: (r: Response) => void = () => {};
    const fetchMock = vi
      .fn<[], Promise<Response>>()
      .mockImplementation(() => new Promise<Response>((r) => (resolveFetch = r)));
    vi.stubGlobal('fetch', fetchMock);

    render(<ExportMenu playthroughId="p1" />);
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Markdown/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /ePub/ })).toBeDisabled();
    });

    resolveFetch(mockResponse(true));
  });
});
