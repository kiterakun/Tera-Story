import type { ReactNode } from 'react';
import { Drawer, DrawerBody } from '../design-system';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'left' | 'right';
}

export function MobileDrawer({ isOpen, onClose, title, children, side = 'right' }: MobileDrawerProps) {
  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={title}
      side={side}
      width="sm"
      className="w-80 max-w-[85vw] border-ink-700"
    >
      <DrawerBody>{children}</DrawerBody>
    </Drawer>
  );
}
