import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NavLink } from '../../../components/Layout/NavLink';

function renderAt(path: string, ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NavLink', () => {
  it('renders children + to', () => {
    renderAt('/worlds', <NavLink to="/worlds">Worlds</NavLink>);
    const link = screen.getByText(/worlds/i);
    expect(link).toHaveAttribute('href', '/worlds');
  });

  it('sets aria-current="page" when path matches exactly', () => {
    renderAt('/worlds', <NavLink to="/worlds">Worlds</NavLink>);
    expect(screen.getByText(/worlds/i)).toHaveAttribute('aria-current', 'page');
  });

  it('omits aria-current when path does not match', () => {
    renderAt('/gallery', <NavLink to="/worlds">Worlds</NavLink>);
    expect(screen.getByText(/worlds/i)).not.toHaveAttribute('aria-current');
  });

  it('applies active style class when active', () => {
    renderAt('/worlds', <NavLink to="/worlds">Worlds</NavLink>);
    expect(screen.getByText(/worlds/i)).toHaveClass('bg-accent-600/10');
  });

  it('applies inactive style class when inactive', () => {
    renderAt('/gallery', <NavLink to="/worlds">Worlds</NavLink>);
    expect(screen.getByText(/worlds/i)).toHaveClass('text-ink-200');
    expect(screen.getByText(/worlds/i)).not.toHaveClass('bg-accent-600/10');
  });

  it('has min-h-[44px] for touch target', () => {
    renderAt('/worlds', <NavLink to="/worlds">Worlds</NavLink>);
    expect(screen.getByText(/worlds/i)).toHaveClass('min-h-[44px]');
  });
});
