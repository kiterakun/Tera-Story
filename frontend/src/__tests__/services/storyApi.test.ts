import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock authStore BEFORE importing storyApi
vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: 'test-jwt-token' })),
  },
}));

import { generateChapterStream } from '../../services/storyApi';

describe('generateChapterStream auth handling', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes Bearer Authorization header when token is in store', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: null,
    });

    generateChapterStream('p1', 'choice1', {
      onToken: () => {},
      onComplete: () => {},
      onError: () => {},
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const init = mockFetch.mock.calls[0][1];
    expect(init.headers).toHaveProperty('Authorization', 'Bearer test-jwt-token');
  });

  it('omits Authorization header when no token in store', async () => {
    // Re-mock with no token
    const authMock = await import('../../stores/authStore');
    (authMock.useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ token: null });

    mockFetch.mockResolvedValueOnce({ ok: true, body: null });

    generateChapterStream('p1', 'choice1', {
      onToken: () => {},
      onComplete: () => {},
      onError: () => {},
    });

    const init = mockFetch.mock.calls[0][1];
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('sets credentials: include (cookie auth still flows)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, body: null });
    generateChapterStream('p1', 'choice1', {
      onToken: () => {},
      onComplete: () => {},
      onError: () => {},
    });
    const init = mockFetch.mock.calls[0][1];
    expect(init.credentials).toBe('include');
  });

  it('uses POST with JSON body containing playthroughId + choice', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, body: null });
    generateChapterStream('p123', 'attack the dragon', {
      onToken: () => {},
      onComplete: () => {},
      onError: () => {},
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ playthroughId: 'p123', choice: 'attack the dragon' }));
    expect(url).toMatch(/story\/generate-stream/);
  });

  it('supports abort via returned controller', async () => {
    // Verify the controller.abort() is invoked when cancel() is called.
    let aborted = false;
    const originalAbortController = AbortController;
    global.AbortController = class {
      signal = { aborted: false };
      abort() { aborted = true; this.signal.aborted = true; }
    } as unknown as typeof AbortController;

    mockFetch.mockResolvedValueOnce({ ok: true, body: null });

    const { cancel } = generateChapterStream('p1', 'c1', {
      onToken: () => {},
      onComplete: () => {},
      onError: () => {},
    });

    cancel();
    expect(aborted).toBe(true);

    global.AbortController = originalAbortController;
  });
});
