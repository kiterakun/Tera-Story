import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../design-system/Badge';

describe('Badge primitive', () => {
  describe('rarity variant', () => {
    const rarities = [
      { r: 'common', needle: 'text-gray-300' },
      { r: 'uncommon', needle: 'text-green-400' },
      { r: 'rare', needle: 'text-blue-400' },
      { r: 'epic', needle: 'text-purple-400' },
      { r: 'legendary', needle: 'text-amber-400' },
    ] as const;

    for (const { r, needle } of rarities) {
      it(`renders ${r} with correct text class`, () => {
        const { unmount } = render(<Badge variant="rarity" rarity={r} />);
        expect(screen.getByText(r)).toHaveClass(needle);
        unmount();
      });
    }

    it('falls back to common for unknown rarity', () => {
      render(<Badge variant="rarity" rarity="not-a-rarity" />);
      expect(screen.getByText('not-a-rarity')).toHaveClass('text-gray-300');
    });
  });

  describe('status variant', () => {
    const statuses = [
      { s: 'active', needle: 'text-green-400' },
      { s: 'injured', needle: 'text-amber-400' },
      { s: 'missing', needle: 'text-gray-400' },
      { s: 'dead', needle: 'text-red-400' },
    ] as const;

    for (const { s, needle } of statuses) {
      it(`renders ${s} with correct text class`, () => {
        const { unmount } = render(<Badge variant="status" status={s} />);
        expect(screen.getByText(s)).toHaveClass(needle);
        unmount();
      });
    }

    it('falls back to missing for unknown status', () => {
      render(<Badge variant="status" status="not-a-status" />);
      expect(screen.getByText('not-a-status')).toHaveClass('text-gray-400');
    });
  });

  describe('shape', () => {
    it('pill shape uses rounded-full by default', () => {
      const { container } = render(<Badge variant="rarity" rarity="rare" />);
      expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('square shape uses rounded-md', () => {
      const { container } = render(<Badge variant="rarity" rarity="rare" shape="square" />);
      expect(container.firstChild).toHaveClass('rounded-md');
      expect(container.firstChild).not.toHaveClass('rounded-full');
    });
  });

  describe('size', () => {
    it('sm size (default) uses text-[10px]', () => {
      const { container } = render(<Badge variant="rarity" rarity="rare" />);
      expect(container.firstChild).toHaveClass('text-[10px]');
    });

    it('md size uses text-xs', () => {
      const { container } = render(<Badge variant="rarity" rarity="rare" size="md" />);
      expect(container.firstChild).toHaveClass('text-xs');
    });
  });

  describe('icon', () => {
    it('renders custom icon when provided', () => {
      render(
        <Badge variant="rarity" rarity="legendary" icon={<span data-testid="badge-icon">★</span>}>
          Rare
        </Badge>,
      );
      expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
      expect(screen.getByText(/rare/i)).toBeInTheDocument();
    });
  });

  describe('custom children', () => {
    it('renders custom children instead of rarity string', () => {
      render(<Badge variant="rarity" rarity="rare">My Label</Badge>);
      expect(screen.getByText('My Label')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('accepts className override', () => {
      const { container } = render(
        <Badge variant="rarity" rarity="epic" className="ml-2" />,
      );
      expect(container.firstChild).toHaveClass('ml-2');
    });
  });

  describe('null safety', () => {
    it('renders nothing when rarity is omitted on rarity variant', () => {
      const { container } = render(<Badge variant="rarity" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when status is omitted on status variant', () => {
      const { container } = render(<Badge variant="status" />);
      expect(container.firstChild).toBeNull();
    });
  });
});
