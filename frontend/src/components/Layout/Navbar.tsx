/**
 * Navbar — sticky top shell composed of Logo, primary NavLinks,
 * ThemeToggle, UserMenu, and MobileMenu.
 *
 * Desktop (≥768px): inline global nav + More dropdown
 * Mobile (<768px): hidden nav, hamburger button
 */

import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Trophy, ChevronDown } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useStoryStore } from '../../stores/storyStore';
import { useTranslation } from '../../i18n';
import { cn } from '../../design-system';
import { NavLink } from './NavLink';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';

/**
 * MoreDropdown — desktop-only dropdown for less-frequently used routes
 * (Chronicle, Fate Threads, Friends, Settings). Outside-click + ESC close.
 */
function MoreDropdown() {
  const t = useTranslation();
  const currentPlaythrough = useStoryStore((s) => s.currentPlaythrough);
  const playthroughId = currentPlaythrough?._id;
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

  const close = () => setOpen(false);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1 px-3 min-h-[44px] rounded-lg text-sm font-medium',
          'transition-colors duration-base ease-standard',
          open
            ? 'bg-accent-600/10 text-accent-400'
            : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
        )}
      >
        {t.layout?.more ?? 'More'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-base ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="More navigation"
          className="absolute right-0 mt-2 w-48 bg-ink-800 border border-ink-700 rounded-xl shadow-lg py-1 animate-scale-in z-50"
        >
          {playthroughId && (
            <>
              <Link
                to={`/chronicle/${playthroughId}`}
                role="menuitem"
                onClick={close}
                className="block px-4 min-h-[44px] py-2.5 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
              >
                {t.layout?.chronicle ?? 'Chronicle'}
              </Link>
              <Link
                to={`/play/${playthroughId}/threads`}
                role="menuitem"
                onClick={close}
                className="block px-4 min-h-[44px] py-2.5 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
              >
                {t.layout?.fateThreads ?? 'Fate Threads'}
              </Link>
              <div className="border-t border-ink-700 my-1" />
            </>
          )}
          <Link
            to="/friends"
            role="menuitem"
            onClick={close}
            className="block px-4 min-h-[44px] py-2.5 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
          >
            {t.layout?.friends ?? 'Friends'}
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            onClick={close}
            className="block px-4 min-h-[44px] py-2.5 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
          >
            {t.layout?.settings ?? 'Settings'}
          </Link>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const t = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-page-x md:px-page-x-lg h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/worlds" className="flex items-center gap-2.5 group">
          <img
            src={logo}
            alt="Tera-Story"
            className="w-8 h-8 rounded-lg shadow-sm group-hover:shadow-glow transition-shadow"
          />
          <span className="font-display text-xl text-ink-100 group-hover:text-accent-400 transition-colors hidden sm:block">
            Tera-Story
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
          <NavLink to="/worlds">{t.layout?.worlds ?? 'Worlds'}</NavLink>
          <NavLink to="/gallery" icon={<LayoutGrid className="w-4 h-4" />}>
            {t.layout?.gallery ?? 'Gallery'}
          </NavLink>
          <NavLink to="/achievements" icon={<Trophy className="w-4 h-4" />}>
            {t.layout?.achievements ?? 'Achievements'}
          </NavLink>
          <MoreDropdown />

          <div className="w-px h-6 bg-ink-700 mx-2" aria-hidden="true" />
          <ThemeToggle />
          <UserMenu />
        </nav>

        {/* Mobile right cluster */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
