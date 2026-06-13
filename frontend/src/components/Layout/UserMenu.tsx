/**
 * UserMenu — avatar + dropdown with full menu keyboard semantics.
 *
 * Implements WAI-ARIA menu pattern:
 * - Button with aria-haspopup="menu" + aria-expanded toggles dropdown
 * - Dropdown panel role="menu" with role="menuitem" children
 * - ArrowDown/ArrowUp cycle focus between menuitems
 * - Home/End jump to first/last menuitem
 * - Escape closes (focus returns to trigger)
 * - Outside-click closes
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
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Outside-click + ESC + arrow-key navigation
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const menu = menuRef.current;
      const trigger = triggerRef.current;
      const target = e.target as Node;
      if (menu && menu.contains(target)) return;
      if (trigger && trigger.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items || items.length === 0) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          // Focus the trigger first (synchronously) so focus doesn't
          // get lost when the menu unmounts.
          triggerRef.current?.focus();
          setOpen(false);
          return;
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Home':
        case 'End': {
          e.preventDefault();
          const currentIndex = Array.from(items).findIndex((el) => el === document.activeElement);
          let nextIndex = currentIndex;
          if (e.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
          if (e.key === 'ArrowUp') nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
          if (e.key === 'Home') nextIndex = 0;
          if (e.key === 'End') nextIndex = items.length - 1;
          items[nextIndex]?.focus();
          return;
        }
      }
    };

    // Focus first menuitem when menu opens
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    items?.[0]?.focus();

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <nav aria-label="User menu" className="relative hidden md:block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
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
          ref={menuRef}
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
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors duration-base focus:bg-ink-700 focus:outline-none"
          >
            {t.layout?.settings ?? 'Settings'}
          </Link>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors duration-base focus:bg-ink-700 focus:outline-none"
          >
            {t.layout?.logout ?? 'Logout'}
          </button>
        </div>
      )}
    </nav>
  );
}
