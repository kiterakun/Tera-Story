import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../design-system/Modal';

// Modal portals to document.body, so cleanup + container queries
// must look there.

describe('Modal primitive', () => {
  describe('Basic rendering', () => {
    it('renders nothing when closed', () => {
      render(
        <Modal open={false} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('renders dialog with role + aria-modal when open', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('sets aria-labelledby to title id', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Edit Profile">
          <div>content</div>
        </Modal>,
      );
      const dialog = screen.getByRole('dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      const titleEl = document.getElementById(labelledBy!);
      expect(titleEl?.textContent).toBe('Edit Profile');
    });

    it('sets aria-describedby to description id when provided', () => {
      render(
        <Modal
          open={true}
          onClose={() => {}}
          title="Test"
          description="A detailed description"
        >
          <div>content</div>
        </Modal>,
      );
      const dialog = screen.getByRole('dialog');
      const describedBy = dialog.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const descEl = document.getElementById(describedBy!);
      expect(descEl?.textContent).toBe('A detailed description');
    });

    it('renders all 5 size variants', () => {
      const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
      sizes.forEach((size) => {
        render(
          <Modal open={true} onClose={() => {}} title={`Modal ${size}`} size={size}>
            <div>content</div>
          </Modal>,
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog.className).toMatch(/max-w-/);
        cleanup();
      });
    });
  });

  describe('Slot components', () => {
    it('ModalHeader renders with bottom border', () => {
      const { container } = render(<ModalHeader>Header content</ModalHeader>);
      expect(container.firstChild).toHaveClass('border-b');
    });

    it('ModalBody renders with padding', () => {
      const { container } = render(<ModalBody>Body content</ModalBody>);
      expect(container.firstChild).toHaveClass('px-6');
    });

    it('ModalFooter renders with top border', () => {
      const { container } = render(<ModalFooter>Footer content</ModalFooter>);
      expect(container.firstChild).toHaveClass('border-t');
    });

    it('ModalTitle renders h2 with id', () => {
      render(<ModalTitle id="my-title">Title Text</ModalTitle>);
      const h2 = document.getElementById('my-title');
      expect(h2?.tagName).toBe('H2');
      expect(h2?.textContent).toBe('Title Text');
    });
  });

  describe('Close behaviors', () => {
    it('close button calls onClose', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose} title="Test">
          <div>content</div>
        </Modal>,
      );
      fireEvent.click(screen.getByRole('button', { name: /close dialog/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('ESC key calls onClose (default behavior)', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose} title="Test">
          <div>content</div>
        </Modal>,
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('closeOnEsc=false disables ESC close', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose} title="Test" closeOnEsc={false}>
          <div>content</div>
        </Modal>,
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('scrim click calls onClose (default behavior)', () => {
      const onClose = vi.fn();
      render(
        <Modal open={true} onClose={onClose} title="Test">
          <div>content</div>
        </Modal>,
      );
      // Scrim is in document.body (portal), has aria-hidden
      const scrim = document.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(scrim).toBeTruthy();
      fireEvent.click(scrim);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('closeOnScrimClick=false disables scrim close', () => {
      const onClose = vi.fn();
      render(
        <Modal
          open={true}
          onClose={onClose}
          title="Test"
          closeOnScrimClick={false}
        >
          <div>content</div>
        </Modal>,
      );
      const scrim = document.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(scrim).toBeTruthy();
      fireEvent.click(scrim);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body scroll lock', () => {
    it('locks body scroll when modal opens', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      expect(document.body.style.overflow).toBe('hidden');
      rerender(
        <Modal open={false} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('Focus trap', () => {
    it('moves focus into modal on open (first focusable = close button)', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <button>First</button>
          <button>Second</button>
        </Modal>,
      );
      // The close button is the first focusable in the modal header.
      const closeBtn = screen.getByRole('button', { name: /close dialog/i });
      expect(closeBtn).toHaveFocus();
    });

    it('keeps focus inside modal on Tab from last item', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <button>A</button>
          <button>B</button>
        </Modal>,
      );
      const b = screen.getByRole('button', { name: /^B$/ });
      b.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      // Should wrap to first focusable (close button)
      const closeBtn = screen.getByRole('button', { name: /close dialog/i });
      expect(closeBtn).toHaveFocus();
    });

    it('keeps focus inside modal on Shift+Tab from first item', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <button>A</button>
          <button>B</button>
        </Modal>,
      );
      // The close button is the first focusable
      const closeBtn = screen.getByRole('button', { name: /close dialog/i });
      closeBtn.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      // Should wrap to last focusable (B button)
      const b = screen.getByRole('button', { name: /^B$/ });
      expect(b).toHaveFocus();
    });
  });

  describe('Portal', () => {
    it('renders modal in document.body (not in parent container)', () => {
      render(
        <div id="parent">
          <Modal open={true} onClose={() => {}} title="Test">
            <div>content</div>
          </Modal>
        </div>,
      );
      // Dialog should NOT be inside #parent
      expect(document.getElementById('parent')?.querySelector('[role="dialog"]')).toBeNull();
      // Dialog SHOULD be in document.body directly
      expect(document.body.querySelector('[role="dialog"]')).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('uses animate-fade-in on backdrop', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      const backdrop = document.querySelector('[role="presentation"]') as HTMLElement;
      expect(backdrop).toHaveClass('animate-fade-in');
    });

    it('uses animate-scale-in on dialog panel', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('animate-scale-in');
    });
  });

  describe('Theme tokens', () => {
    it('uses bg-scrim for backdrop', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      const scrim = document.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(scrim).toHaveClass('bg-scrim');
    });

    it('uses design-system tokens (no raw colors)', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test">
          <div>content</div>
        </Modal>,
      );
      const html = document.body.innerHTML;
      expect(html).not.toMatch(/bg-black|bg-white|text-white/);
    });
  });
});
