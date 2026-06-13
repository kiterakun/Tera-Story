import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '../../design-system/Drawer';

describe('Drawer primitive', () => {
  describe('Basic rendering', () => {
    it('renders nothing when closed', () => {
      render(
        <Drawer open={false} onClose={() => {}} title="Test">
          <div>content</div>
        </Drawer>,
      );
      expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('renders dialog when open', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Drawer>,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('inherits Modal a11y: role + aria-modal + aria-labelledby', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Edit">
          <div>content</div>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)?.textContent).toBe('Edit');
    });
  });

  describe('Side variants', () => {
    const sides = ['right', 'left', 'top', 'bottom'] as const;

    for (const side of sides) {
      it(`renders panel on ${side} edge with corresponding animation`, () => {
        const expectedAnimation = `animate-slide-in-${side}`;
        render(
          <Drawer open={true} onClose={() => {}} title="Test" side={side}>
            <div>content</div>
          </Drawer>,
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog.className).toMatch(new RegExp(expectedAnimation));
      });
    }

    it('defaults to right side', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toMatch(/animate-slide-in-right/);
    });

    it('right drawer has full height', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test" side="right">
          <div>content</div>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toMatch(/h-full/);
    });

    it('bottom drawer has width-full + max-height', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test" side="bottom">
          <div>content</div>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toMatch(/w-full/);
    });
  });

  describe('Width variants', () => {
    it('sm width uses w-72', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test" width="sm">
          <div>content</div>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toMatch(/w-72/);
    });

    it('md width uses w-96 (default)', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toMatch(/w-96/);
    });

    it('xl width uses larger size', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test" width="xl">
          <div>content</div>
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toMatch(/w-\[36rem\]/);
    });
  });

  describe('Close behaviors (inherited from Modal)', () => {
    it('ESC dismisses', () => {
      const onClose = vi.fn();
      render(
        <Drawer open={true} onClose={onClose} title="Test">
          <div>content</div>
        </Drawer>,
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('closeOnEsc=false disables ESC', () => {
      const onClose = vi.fn();
      render(
        <Drawer open={true} onClose={onClose} title="Test" closeOnEsc={false}>
          <div>content</div>
        </Drawer>,
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('scrim click dismisses (default)', () => {
      const onClose = vi.fn();
      render(
        <Drawer open={true} onClose={onClose} title="Test">
          <div>content</div>
        </Drawer>,
      );
      const scrim = document.querySelector('[aria-hidden="true"]') as HTMLElement;
      fireEvent.click(scrim);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('close button dismisses', () => {
      const onClose = vi.fn();
      render(
        <Drawer open={true} onClose={onClose} title="Test">
          <div>content</div>
        </Drawer>,
      );
      fireEvent.click(screen.getByRole('button', { name: /close dialog/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('Focus management (inherited from Modal)', () => {
    it('focuses first focusable on open (close button)', () => {
      render(
        <Drawer open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Drawer>,
      );
      expect(screen.getByRole('button', { name: /close dialog/i })).toHaveFocus();
    });
  });

  describe('Slot composition', () => {
    it('DrawerHeader / DrawerBody / DrawerFooter render correctly', () => {
      const { container } = render(
        <Drawer open={true} onClose={() => {}} title="Drawer Test">
          <DrawerHeader>Header</DrawerHeader>
          <DrawerBody>Body</DrawerBody>
          <DrawerFooter>Footer</DrawerFooter>
        </Drawer>,
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
      expect(container).toBeTruthy();
    });
  });
});
