import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const register = useAuthStore(s => s.register);
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
      await register(username, email, password);
      navigate('/worlds');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 p-4">
      <div className="bg-ink-800 border border-ink-700 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-accent-400 mb-2">Tera-Story</h1>
          <p className="text-ink-200 opacity-70">Enter the realm</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="bg-ink-950 border border-ink-700 text-ink-200 rounded-lg px-4 py-3 w-full focus:border-accent-400 focus:ring-1 focus:ring-accent-400 outline-none transition-colors"
            />
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="bg-ink-950 border border-ink-700 text-ink-200 rounded-lg px-4 py-3 w-full focus:border-accent-400 focus:ring-1 focus:ring-accent-400 outline-none transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="bg-ink-950 border border-ink-700 text-ink-200 rounded-lg px-4 py-3 w-full focus:border-accent-400 focus:ring-1 focus:ring-accent-400 outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-accent-400 hover:bg-accent-600 text-white font-semibold py-3 px-6 rounded-lg w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-ink-200 opacity-70 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-400 hover:text-accent-600 transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
