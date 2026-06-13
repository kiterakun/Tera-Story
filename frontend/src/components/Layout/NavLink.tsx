/**
 * NavLink — active-route aware link for the primary navigation.
 *
 * Uses React Router's useMatch for active detection. Adds
 * aria-current="page" when the link's route matches the current
 * URL. Includes min-h-[44px] to satisfy WCAG 2.1 AA touch target.
 */

import type { ReactNode } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { cn } from '../../design-system';

export interface NavLinkProps {
  to: string;
  exact?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavLink({
  to,
  exact = false,
  children,
  icon,
  className,
  onClick,
}: NavLinkProps) {
  const match = useMatch({ path: to, end: exact });
  const isActive = !!match;

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium',
        'transition-colors duration-base ease-standard',
        isActive
          ? 'bg-accent-600/10 text-accent-400'
          : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800',
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
