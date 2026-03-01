import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useTranslation } from '../i18n';

export function Layout({ children }: { children: React.ReactNode }) {
  const t = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-ink-950 text-ink-200">
      {/* Navbar */}
      <nav className="border-b border-ink-700 bg-ink-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/worlds" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white font-display text-sm font-bold group-hover:bg-accent-500 transition-colors shadow-sm">
              T
            </div>
            <span className="font-display text-xl text-ink-100 group-hover:text-accent-400 transition-colors hidden sm:block">
              Tera-Story
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/worlds"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/worlds')
                  ? 'bg-accent-600/10 text-accent-400'
                  : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800'
              }`}
            >
              {t.layout.worlds}
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/settings')
                  ? 'bg-accent-600/10 text-accent-400'
                  : 'text-ink-200 hover:text-ink-100 hover:bg-ink-800'
              }`}
            >
              {t.layout.settings}
            </Link>
            
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
              onClick={() => setMenuOpen(false)}
            >
              {t.layout.worlds}
            </Link>
            <Link
              to="/settings"
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive('/settings') ? 'bg-accent-600/10 text-accent-400' : 'text-ink-200 hover:bg-ink-800'}`}
              onClick={() => setMenuOpen(false)}
            >
              {t.layout.settings}
            </Link>
            {user && (
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
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
