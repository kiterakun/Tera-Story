import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { XPBar } from '../../../components/progression/XPBar';

describe('XPBar', () => {
  it('renders a progressbar with proper aria values', () => {
    render(<XPBar currentXp={75} xpToNextLevel={100} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps percent between 0 and 100', () => {
    const { rerender } = render(<XPBar currentXp={150} xpToNextLevel={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    rerender(<XPBar currentXp={-10} xpToNextLevel={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('has no axe violations', async () => {
    const { container } = render(<XPBar currentXp={50} xpToNextLevel={100} animated />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
