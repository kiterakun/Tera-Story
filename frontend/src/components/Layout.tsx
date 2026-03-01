import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink-950 text-parchment-50">
      {/* Navbar */}
      <nav className="border-b border-ink-700 bg-ink-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/worlds" className="font-display text-xl text-parchment-50 hover:text-accent-400 transition-colors">
            Tera-Story
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/worlds" className="text-ink-200 hover:text-parchment-50 transition-colors text-sm">
              Worlds
            </Link>
            <Link to="/settings" className="text-ink-200 hover:text-parchment-50 transition-colors text-sm">
              Settings
            </Link>
            
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="text-ink-200 hover:text-parchment-50 transition-colors text-lg"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* User menu */}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-ink-200 text-sm">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-ink-200 hover:text-parchment-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-ink-200 hover:text-parchment-50"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-ink-700 bg-ink-900 px-4 py-3 space-y-3">
            <Link to="/worlds" className="block text-ink-200 hover:text-parchment-50" onClick={() => setMenuOpen(false)}>Worlds</Link>
            <Link to="/settings" className="block text-ink-200 hover:text-parchment-50" onClick={() => setMenuOpen(false)}>Settings</Link>
            <button onClick={toggleTheme} className="block text-ink-200 hover:text-parchment-50">
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            {user && <button onClick={handleLogout} className="block text-ink-200 hover:text-parchment-50">Logout ({user.username})</button>}
          </div>
        )}
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
