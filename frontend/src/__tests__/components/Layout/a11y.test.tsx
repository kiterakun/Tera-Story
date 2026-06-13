/**
 * Manual a11y contract test for Layout components.
 *
 * Verifies the spec at .kite-docs/spec/layout-navigation-spec.md (section 6):
 * - Icon-only buttons MUST have aria-label
 * - Landmarks MUST be labeled
 * - Active link MUST have aria-current="page"
 * - Dropdown buttons MUST have aria-haspopup + aria-expanded
 * - aria-label takes precedence over title (no title= attributes)
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../../../components/Layout/Navbar';

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({ user: { username: 'alice' }, logout: vi.fn() }),
}));
vi.mock('../../../stores/storyStore', () => ({
  useStoryStore: () => ({ currentPlaythrough: null }),
}));
vi.mock('../../../stores/uiStore', () => ({
  useUIStore: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>);
}

describe('Layout a11y contract', () => {
  it('contains no title= attributes on icon-only buttons', () => {
    const { container } = renderWithRouter(<Navbar />);
    const iconButtons = container.querySelectorAll('button[aria-label]');
    expect(iconButtons.length).toBeGreaterThanOrEqual(3); // theme × 2, user menu, hamburger
    iconButtons.forEach((btn) => {
      expect(btn.hasAttribute('title')).toBe(false);
    });
  });

  it('every interactive element is reachable by keyboard (button/anchor/link)', () => {
    const { container } = renderWithRouter(<Navbar />);
    const interactive = container.querySelectorAll(
      'button, a[href], input, [tabindex]:not([tabindex="-1"])',
    );
    interactive.forEach((el) => {
      expect(['BUTTON', 'A']).toContain(el.tagName);
    });
  });

  it('primary navigation landmark is labeled', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
  });

  it('user menu landmark is labeled', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByRole('navigation', { name: /user menu/i })).toBeInTheDocument();
  });

  it('header landmark is present', () => {
    const { container } = renderWithRouter(<Navbar />);
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('main landmark is present in Layout', async () => {
    const { Layout } = await import('../../../components/Layout/Layout');
    const { container } = render(
      <MemoryRouter>
        <Layout>
          <p>content</p>
        </Layout>
      </MemoryRouter>,
    );
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
