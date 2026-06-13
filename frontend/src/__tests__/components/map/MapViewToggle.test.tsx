import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { MapViewToggle } from '../../../components/map/MapViewToggle';
import { WorldMapView } from '../../../components/map/WorldMapView';

describe('MapViewToggle', () => {
  it('marks the active view with aria-selected', () => {
    render(<MapViewToggle viewMode="standard" onChange={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(2);
    const standard = screen.getByRole('tab', { name: /Bản Đồ Chuẩn|Standard/ });
    expect(standard).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onChange when a tab is clicked', () => {
    const onChange = vi.fn();
    render(<MapViewToggle viewMode="standard" onChange={onChange} />);
    screen.getByRole('tab', { name: /Bản Đồ 3 Cấp|3-level/ }).click();
    expect(onChange).toHaveBeenCalledWith('3level');
  });

  it('has no axe violations', async () => {
    const { container } = render(<MapViewToggle viewMode="3level" onChange={vi.fn()} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('MapPage route shell', () => {
  it('WorldMapView renders without crashing when wrapped in MemoryRouter', () => {
    // The WorldMapView renders the geographical outline heading as
    // soon as useMapViewState resolves its loading flag, which in
    // a test environment immediately hits the empty/error state.
    // We just verify it doesn't throw and the component is mountable.
    const { container } = render(
      <MemoryRouter initialEntries={['/worlds/w1']}>
        <Routes>
          <Route path="/worlds/:worldId" element={<WorldMapView worldId="w1" />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(container).toBeInTheDocument();
  });
});
