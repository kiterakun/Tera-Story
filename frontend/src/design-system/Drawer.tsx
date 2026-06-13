/**
 * Drawer — slide-in panel variant of Modal.
 *
 * Inherits Modal's full a11y contract (focus trap, ESC, role=dialog,
 * aria-modal, focus restore, body scroll lock) and adds:
 * - Slides in from a chosen edge (right/left/top/bottom)
 * - Animates with `animate-slide-in-{side}` (or animate-fade-in for
 *   prefers-reduced-motion, handled by the global CSS rule)
 * - Panel positioned at the chosen edge, not centered
 *
 * Spec: .kite-docs/spec/modal-primitive-spec.md (section 3.4)
 */

import { forwardRef, type ReactNode } from 'react';
import { cn } from './cn';
import { Modal, ModalBody, ModalFooter, ModalHeader, type ModalSize } from './Modal';

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerWidth = 'sm' | 'md' | 'lg' | 'xl';

const SIDE_CLASS: Record<DrawerSide, { container: string; panel: string; animation: string }> = {
  right: {
    container: 'justify-end',
    panel: 'h-full max-h-screen rounded-l-2xl rounded-r-none',
    animation: 'animate-slide-in-right',
  },
  left: {
    container: 'justify-start',
    panel: 'h-full max-h-screen rounded-r-2xl rounded-l-none',
    animation: 'animate-slide-in-left',
  },
  top: {
    container: 'items-start justify-center',
    panel: 'w-full max-h-[80vh] rounded-b-2xl rounded-t-none',
    animation: 'animate-slide-in-top',
  },
  bottom: {
    container: 'items-end justify-center',
    panel: 'w-full max-h-[80vh] rounded-t-2xl rounded-b-none',
    animation: 'animate-slide-in-bottom',
  },
};

const WIDTH_CLASS: Record<DrawerWidth, string> = {
  sm: 'w-72 max-w-[85vw]',
  md: 'w-96 max-w-[85vw]',
  lg: 'w-[28rem] max-w-[90vw]',
  xl: 'w-[36rem] max-w-[95vw]',
};

// Top/bottom drawers get a height-based width instead
const DIMENSION_OVERRIDE: Record<DrawerSide, Record<DrawerWidth, string>> = {
  top: {
    sm: 'h-72 max-h-[60vh] w-full max-w-screen',
    md: 'h-96 max-h-[70vh] w-full max-w-screen',
    lg: 'h-[28rem] max-h-[75vh] w-full max-w-screen',
    xl: 'h-[36rem] max-h-[80vh] w-full max-w-screen',
  },
  bottom: {
    sm: 'h-72 max-h-[60vh] w-full max-w-screen',
    md: 'h-96 max-h-[70vh] w-full max-w-screen',
    lg: 'h-[28rem] max-h-[75vh] w-full max-w-screen',
    xl: 'h-[36rem] max-h-[80vh] w-full max-w-screen',
  },
  left: {},
  right: {},
};

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  side?: DrawerSide;
  width?: DrawerWidth;
  closeOnEsc?: boolean;
  closeOnScrimClick?: boolean;
  className?: string;
  children?: ReactNode;
}

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
    open,
    onClose,
    title,
    description,
    side = 'right',
    width = 'md',
    closeOnEsc = true,
    closeOnScrimClick = true,
    className,
    children,
  },
  ref,
) {
  // Modal renders the scrim + dialog wrapper. We override panel position
  // via className; the underlying Modal handles focus trap + scroll lock.
  const sideClasses = SIDE_CLASS[side];
  // Use side-specific dimension override if present, else fall back to width
  const dimensionClass = DIMENSION_OVERRIDE[side][width] ?? WIDTH_CLASS[width];

  return (
    <Modal
      ref={ref}
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeOnEsc={closeOnEsc}
      closeOnScrimClick={closeOnScrimClick}
      size="full"
      className={cn(
        'w-auto',
        sideClasses.panel,
        dimensionClass,
        sideClasses.animation,
        className,
      )}
    >
      {children}
    </Modal>
  );
});

// Re-export slot components so consumers can compose Drawer bodies
export { ModalHeader as DrawerHeader, ModalBody as DrawerBody, ModalFooter as DrawerFooter };
export type { ModalSize as DrawerSize };
