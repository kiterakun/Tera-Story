/**
 * UserMenu — avatar + dropdown with proper menu semantics.
 *
 * Renders a button with aria-haspopup + aria-expanded and the
 * dropdown panel with role="menu". Outside-click closes. ESC
 * closes (will be migrated to Modal primitive in Phase 3).
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import { cn } from '../../design-system';

export function UserMenu() {
  const t = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setOpen(false);

  return (
    <nav aria-label="User menu" className="relative hidden md:block">
      <button
        ref={containerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.username}`}
        className={cn(
          'min-h-[44px] inline-flex items-center gap-2 rounded-lg px-2',
          'text-ink-200 hover:text-ink-100 hover:bg-ink-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          'transition-colors duration-base ease-standard',
        )}
      >
        <span className="w-8 h-8 rounded-full bg-accent-600/20 border border-accent-400/30 flex items-center justify-center text-accent-400 text-xs font-bold">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-base ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-ink-800 border border-ink-700 shadow-lg py-2 animate-scale-in z-50"
        >
          <div className="px-4 py-2 border-b border-ink-700">
            <p className="text-sm font-medium text-ink-100 truncate">{user.username}</p>
          </div>
          <Link
            to="/settings"
            role="menuitem"
            onClick={closeMenu}
            className="block px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors duration-base"
          >
            {t.layout?.settings ?? 'Settings'}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors duration-base"
          >
            {t.layout?.logout ?? 'Logout'}
          </button>
        </div>
      )}
    </nav>
  );
}
