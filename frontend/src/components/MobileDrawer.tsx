import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'left' | 'right';
}

export function MobileDrawer({ isOpen, onClose, title, children, side = 'right' }: MobileDrawerProps) {
  if (!isOpen) return null;

  const positionClasses = side === 'right'
    ? 'right-0 translate-x-0'
    : 'left-0 translate-x-0';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 ${positionClasses} h-full w-80 max-w-[85vw] bg-ink-900 border-${side === 'right' ? 'l' : 'r'} border-ink-700 z-50 flex flex-col lg:hidden transform transition-transform duration-300 ease-out`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-700 shrink-0">
          <h3 className="font-display text-sm text-ink-100 uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-100 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}
