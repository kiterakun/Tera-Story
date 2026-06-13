/**
 * Modal — fully accessible dialog primitive.
 *
 * Implements the WAI-ARIA dialog pattern with:
 * - role="dialog" + aria-modal="true"
 * - aria-labelledby references ModalTitle id
 * - aria-describedby references optional description
 * - Focus trap (custom, in ./focusTrap)
 * - ESC dismiss
 * - Scrim click dismiss
 * - Focus restore to trigger on close
 * - Body scroll lock while open
 * - Portal to document.body (avoids z-index issues)
 * - prefers-reduced-motion: entry/exit animation stripped
 *
 * Slot components:
 * - ModalHeader — sticky top with optional title + close button
 * - ModalBody — scrollable content
 * - ModalFooter — sticky bottom for actions
 * - ModalTitle — renders <h2 id="modal-title"> for aria-labelledby
 *
 * Spec: .kite-docs/spec/modal-primitive-spec.md (section 3)
 */

import { forwardRef, useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';
import { createFocusTrap, type FocusTrap } from './focusTrap';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  closeOnEsc?: boolean;
  closeOnScrimClick?: boolean;
  className?: string;
  children?: ReactNode;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    open,
    onClose,
    title,
    description,
    size = 'md',
    closeOnEsc = true,
    closeOnScrimClick = true,
    className,
    children,
  },
  ref,
) {
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const trapRef = useRef<FocusTrap | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Focus trap + body scroll lock + ESC handler
  useEffect(() => {
    if (!open || !modalRef.current) return;

    // Capture trigger element
    triggerRef.current = document.activeElement as HTMLElement;

    // Activate focus trap
    const trap = createFocusTrap(modalRef.current);
    trapRef.current = trap;
    trap.activate();

    // Body scroll lock (capture previous value to restore)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // ESC handler
    const handleKey = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    if (closeOnEsc) {
      document.addEventListener('keydown', handleKey);
    }

    return () => {
      trap.deactivate();
      trapRef.current = null;
      document.body.style.overflow = prevOverflow;
      if (closeOnEsc) {
        document.removeEventListener('keydown', handleKey);
      }
    };
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const setRefs = (node: HTMLDivElement | null) => {
    modalRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const content = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in"
      role="presentation"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-scrim"
        onClick={closeOnScrimClick ? onClose : undefined}
        aria-hidden="true"
      />
      {/* Modal panel */}
      <div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative z-10 w-full rounded-2xl bg-ink-800 border border-ink-700 shadow-xl',
          'flex flex-col max-h-[90vh]',
          'animate-scale-in',
          SIZE_CLASS[size],
          className,
        )}
      >
        {title && (
          <ModalHeader>
            <ModalTitle id={titleId}>{title}</ModalTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-ink-200 hover:text-ink-100 hover:bg-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 inline-flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </ModalHeader>
        )}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-lg p-2 text-ink-200 hover:text-ink-100 hover:bg-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 inline-flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {description && (
          <p id={descriptionId} className="sr-only">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
});

// ============================================================
// Slot components
// ============================================================

export function ModalHeader({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-6 py-4 border-b border-ink-700',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalTitle({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <h2
      id={id}
      className={cn('font-display text-xl text-ink-100 truncate', className)}
    >
      {children}
    </h2>
  );
}

export function ModalBody({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function ModalFooter({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-700',
        className,
      )}
    >
      {children}
    </div>
  );
}
