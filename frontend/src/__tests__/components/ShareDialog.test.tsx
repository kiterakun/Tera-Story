import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ShareDialog } from '../../components/ShareDialog';

// Mock toast lib to avoid side effects
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

const mockResponse = (body: unknown) =>
  ({
    json: () => Promise.resolve(body),
  }) as unknown as Response;

describe('ShareDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<ShareDialog playthroughId="p1" open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('fetches a share token on open and shows URL', async () => {
    const fetchMock = vi
      .fn<[], Promise<Response>>()
      .mockResolvedValue(
        mockResponse({ status: 'success', data: { token: 'abc123', expiresAt: '2099-01-01' } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<ShareDialog playthroughId="p1" open onClose={vi.fn()} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/playthroughs/p1/share', {
        method: 'POST',
        credentials: 'include',
      });
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Share URL')).toBeInTheDocument();
    });
  });

  it('calls onClose when token fetch fails', async () => {
    const fetchMock = vi
      .fn<[], Promise<Response>>()
      .mockResolvedValue(mockResponse({ status: 'error', error: 'Forbidden' }));
    vi.stubGlobal('fetch', fetchMock);
    const onClose = vi.fn();

    render(<ShareDialog playthroughId="p1" open onClose={onClose} />);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('copies URL to clipboard when Copy is pressed', async () => {
    const fetchMock = vi
      .fn<[], Promise<Response>>()
      .mockResolvedValue(
        mockResponse({ status: 'success', data: { token: 'tok', expiresAt: '2099-01-01' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<ShareDialog playthroughId="p1" open onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Share URL')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Copy/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
  });
});
