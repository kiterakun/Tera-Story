/**
 * Smoke a11y test — runs axe-core against key rendered pages to verify
 * there are no WCAG 2.1 A/AA violations.
 *
 * This is a lightweight smoke test, not exhaustive coverage. It
 * catches common regressions (missing aria-label, missing alt text,
 * unlabeled buttons, color contrast, heading hierarchy).
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import WorldListPage from '../../pages/WorldListPage';

// Mock stores / API for the pages so they render without context errors
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { username: 'alice' }, logout: vi.fn() }),
}));

vi.mock('../../stores/worldStore', () => ({
  useWorldStore: () => ({
    worlds: [],
    currentWorld: null,
    isLoading: false,
    error: null,
    fetchWorlds: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('../../services/worldApi', () => ({
  listWorlds: vi.fn().mockResolvedValue({ worlds: [] }),
  getWorld: vi.fn().mockResolvedValue({ world: null }),
  createWorld: vi.fn().mockResolvedValue({ world: null }),
}));

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { data: { worlds: [] } } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('A11y smoke — Page routes', () => {
  it('LoginPage renders without axe violations', async () => {
    const { container } = renderWithRouter(<LoginPage />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('RegisterPage renders without axe violations', async () => {
    const { container } = renderWithRouter(<RegisterPage />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('WorldListPage renders without axe violations', async () => {
    const { container } = renderWithRouter(<WorldListPage />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('A11y smoke — Design-system primitives', () => {
  it('Button (primary) renders without axe violations', async () => {
    const { Button } = await import('../../design-system');
    const { container } = render(<Button>Save</Button>);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('Button with icon-only has aria-label (passes axe button-name check)', async () => {
    const { Button } = await import('../../design-system');
    const { container } = render(
      <Button aria-label="Save changes">
        <span data-testid="icon">★</span>
      </Button>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('Modal with title renders without axe violations', async () => {
    const { Modal, ModalBody } = await import('../../design-system');
    const { container } = render(
      <Modal open={true} onClose={() => {}} title="Test Dialog">
        <ModalBody>Content</ModalBody>
      </Modal>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
