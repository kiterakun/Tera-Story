import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Trophy, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useStoryStore } from '../stores/storyStore';
import { useTranslation } from '../i18n';
import logo from '../assets/logo.png';

export function Layout({ children }: { children: React.ReactNode }) {
  const t = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const currentPlaythrough = useStoryStore(s => s.currentPlaythrough);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const playthroughId = currentPlaythrough?._id;

  const closeDropdowns = () => {
    setMenuOpen(false);
    setMoreOpen(false);
  };

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-accent-600/10 text-accent-400'
        : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800'
    }`;

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200">
      {/* Navbar */}
      <nav className="border-b border-ink-700 bg-ink-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/worlds" className="flex items-center gap-2.5 group">
            <img src={logo} alt="Tera-Story" className="w-8 h-8 rounded-lg shadow-sm group-hover:shadow-accent-600/20 transition-shadow" />
            <span className="font-display text-xl text-ink-100 group-hover:text-accent-400 transition-colors hidden sm:block">
              Tera-Story
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/worlds" className={navLinkClass('/worlds')}>
              {t.layout.worlds}
            </Link>
            <Link to="/gallery" className={navLinkClass('/gallery')}>
              <LayoutGrid className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {t.layout.gallery}
            </Link>
            <Link to="/achievements" className={navLinkClass('/achievements')}>
              <Trophy className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {t.layout.achievements}
            </Link>

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                  moreOpen
                    ? 'bg-accent-600/10 text-accent-400'
                    : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800'
                }`}
              >
                {t.layout.more}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-ink-800 border border-ink-700 rounded-lg shadow-xl z-20 py-1 animate-fade-in">
                    {playthroughId && (
                      <>
                        <Link
                          to={`/chronicle/${playthroughId}`}
                          onClick={() => setMoreOpen(false)}
                          className="block px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
                        >
                          {t.layout.chronicle}
                        </Link>
                        <Link
                          to={`/play/${playthroughId}/threads`}
                          onClick={() => setMoreOpen(false)}
                          className="block px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
                        >
                          {t.layout.fateThreads}
                        </Link>
                        <div className="border-t border-ink-700 my-1" />
                      </>
                    )}
                    <Link
                      to="/friends"
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
                    >
                      {t.layout.friends}
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-700 transition-colors"
                    >
                      {t.layout.settings}
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-6 bg-ink-700 mx-2" />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-9 h-9 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 transition-all duration-200 flex items-center justify-center"
              title={theme === 'dark' ? t.layout.switchToLight : t.layout.switchToDark}
            >
              {theme === 'dark' ? (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* User menu */}
            {user && (
              <div className="flex items-center gap-2 ml-1">
                <div className="w-8 h-8 rounded-full bg-accent-600/20 border border-accent-400/30 flex items-center justify-center text-accent-400 text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-ink-200 hover:text-ink-100 hover:bg-ink-800 px-2.5 py-1.5 rounded-lg transition-all duration-200"
                >
                  {t.layout.logout}
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 transition-colors flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <button
              className="w-9 h-9 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 transition-colors flex items-center justify-center"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-ink-700 bg-ink-900 px-4 py-3 space-y-1 animate-fade-in">
            <Link
              to="/worlds"
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/worlds') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
              onClick={closeDropdowns}
            >
              {t.layout.worlds}
            </Link>
            <Link
              to="/gallery"
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/gallery') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
              onClick={closeDropdowns}
            >
              <LayoutGrid className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {t.layout.gallery}
            </Link>
            <Link
              to="/achievements"
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/achievements') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
              onClick={closeDropdowns}
            >
              <Trophy className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {t.layout.achievements}
            </Link>

            {playthroughId && (
              <>
                <div className="border-t border-ink-700 my-2" />
                <Link
                  to={`/chronicle/${playthroughId}`}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/chronicle') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
                  onClick={closeDropdowns}
                >
                  {t.layout.chronicle}
                </Link>
                <Link
                  to={`/play/${playthroughId}/threads`}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/play') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
                  onClick={closeDropdowns}
                >
                  {t.layout.fateThreads}
                </Link>
              </>
            )}

            <div className="border-t border-ink-700 my-2" />
            <Link
              to="/friends"
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/friends') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
              onClick={closeDropdowns}
            >
              {t.layout.friends}
            </Link>
            <Link
              to="/settings"
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/settings') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
              onClick={closeDropdowns}
            >
              {t.layout.settings}
            </Link>
            {user && (
              <button
                onClick={() => { handleLogout(); closeDropdowns(); }}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-ink-200 hover:bg-ink-800 transition-colors"
              >
                {t.layout.logout} ({user.username})
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
