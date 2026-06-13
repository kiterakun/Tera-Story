/**
 * MobileMenu — hamburger button (visible <768px) that opens a
 * slide-in drawer with all nav links.
 *
 * Phase 2 uses an inline drawer with ESC + outside-click handling.
 * Phase 3 will migrate this to use the Modal primitive.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LayoutGrid, Trophy, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useStoryStore } from '../../stores/storyStore';
import { useTranslation } from '../../i18n';
import { cn } from '../../design-system';

export function MobileMenu() {
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const currentPlaythrough = useStoryStore((s) => s.currentPlaythrough);
  const playthroughId = currentPlaythrough?._id;

  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setOpen(false);
    // Restore focus to trigger
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleEsc);
    // Lock body scroll while drawer is open (standard scroll-lock pattern).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const linkClass = (path: string) =>
    cn(
      'flex items-center gap-2.5 min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium',
      'transition-colors duration-base ease-standard',
      isActive(path)
        ? 'bg-accent-600/10 text-accent-400'
        : 'text-ink-200 hover:bg-ink-800 hover:text-ink-100',
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className={cn(
          'md:hidden min-h-[44px] min-w-[44px] rounded-lg p-2',
          'text-ink-200 hover:text-ink-100 hover:bg-ink-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          'transition-colors duration-base ease-standard',
          'inline-flex items-center justify-center',
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-scrim animate-fade-in"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
            className={cn(
              'fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw]',
              'bg-ink-900 border-l border-ink-700 shadow-xl',
              'flex flex-col animate-slide-in-right',
            )}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-ink-700">
              <span className="font-display text-lg text-ink-100">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-ink-200 hover:text-ink-100 hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              <Link to="/worlds" onClick={closeMenu} className={linkClass('/worlds')}>
                {t.layout?.worlds ?? 'Worlds'}
              </Link>
              <Link to="/gallery" onClick={closeMenu} className={linkClass('/gallery')}>
                <LayoutGrid className="w-4 h-4" />
                {t.layout?.gallery ?? 'Gallery'}
              </Link>
              <Link to="/achievements" onClick={closeMenu} className={linkClass('/achievements')}>
                <Trophy className="w-4 h-4" />
                {t.layout?.achievements ?? 'Achievements'}
              </Link>

              {playthroughId && (
                <>
                  <div className="my-2 border-t border-ink-700" />
                  <Link to={`/chronicle/${playthroughId}`} onClick={closeMenu} className={linkClass('/chronicle')}>
                    {t.layout?.chronicle ?? 'Chronicle'}
                  </Link>
                  <Link to={`/play/${playthroughId}/threads`} onClick={closeMenu} className={linkClass('/play')}>
                    {t.layout?.fateThreads ?? 'Fate Threads'}
                  </Link>
                </>
              )}

              <div className="my-2 border-t border-ink-700" />
              <Link to="/friends" onClick={closeMenu} className={linkClass('/friends')}>
                <Users className="w-4 h-4" />
                {t.layout?.friends ?? 'Friends'}
              </Link>
              <Link to="/settings" onClick={closeMenu} className={linkClass('/settings')}>
                {t.layout?.settings ?? 'Settings'}
              </Link>
            </nav>

            {user && (
              <div className="border-t border-ink-700 p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 min-h-[44px] w-full px-4 py-2 rounded-lg text-sm font-medium text-ink-200 hover:bg-ink-800 hover:text-ink-100 transition-colors duration-base"
                >
                  {t.layout?.logout ?? 'Logout'} ({user.username})
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
