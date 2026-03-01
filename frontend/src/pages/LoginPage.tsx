import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n';

export default function LoginPage() {
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(s => s.login);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLoading = useAuthStore(s => s.isLoading);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/worlds" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/worlds');
    } catch (err: any) {
      setError(err.response?.data?.message || t.login.failed);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 p-4">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-ink-800 border border-ink-700 rounded-2xl p-8 sm:p-10 max-w-md w-full shadow-2xl shadow-black/20 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-600 flex items-center justify-center text-white font-display text-2xl font-bold mx-auto mb-4 shadow-lg shadow-accent-600/25">
            T
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-100 mb-2">{t.login.title}</h1>
          <p className="text-ink-200/60 text-sm">{t.login.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-200/70 mb-1.5">{t.login.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-ink-950 border border-ink-700 text-ink-100 rounded-xl px-4 py-3 w-full focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all placeholder:text-ink-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-200/70 mb-1.5">{t.login.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-ink-950 border border-ink-700 text-ink-100 rounded-xl px-4 py-3 w-full focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all placeholder:text-ink-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-accent-600 hover:bg-accent-500 text-white font-semibold py-3 px-6 rounded-xl w-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg hover:shadow-accent-600/20 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {t.login.loggingIn}
              </span>
            ) : t.login.loginBtn}
          </button>
        </form>

        <p className="text-center text-ink-200/60 mt-6 text-sm">
          {t.login.noAccount}{' '}
          <Link to="/register" className="text-accent-400 hover:text-accent-500 transition-colors font-medium">
            {t.login.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
