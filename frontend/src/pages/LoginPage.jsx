import { useId, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const id = useId();
  const { isAuthenticated, login, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const destination = location.state?.from?.pathname || '/dashboard';

  if (!initializing && isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-elevated mx-auto mt-12 max-w-md p-6">
      <h1 className="text-xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Access your learning dashboard.</p>
      <p className="mt-2 text-xs text-muted">Your session is token-based and isolated per account.</p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="field-label" htmlFor={`${id}-email`}>Email</label>
          <input
            id={`${id}-email`}
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`${id}-password`}>Password</label>
          <input
            id={`${id}-password`}
            className="input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </div>
        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-400" role="alert" aria-live="assertive">{error}</p> : null}

      <p className="mt-3 text-sm text-muted">
        <Link className="text-accent hover:brightness-110" to="/forgot-password">
          Forgot password?
        </Link>
      </p>

      <p className="mt-4 text-sm text-muted">
        Need an account?{' '}
        <Link className="text-accent hover:brightness-110" to="/register">
          Create one
        </Link>
      </p>
    </div>
  );
}
