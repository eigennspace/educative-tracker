import { useId, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RegisterPage() {
  const id = useId();
  const { isAuthenticated, register, initializing } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!initializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-elevated mx-auto mt-12 max-w-md p-6">
      <h1 className="text-xl font-semibold text-ink">Create account</h1>
      <p className="mt-1 text-sm text-muted">Start tracking your learning progress.</p>
      <p className="mt-2 text-xs text-muted">Use a strong password with 8+ characters.</p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="field-label" htmlFor={`${id}-name`}>Full name</label>
          <input
            id={`${id}-name`}
            className="input"
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </div>
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
            minLength={8}
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            aria-describedby={`${id}-password-help`}
            required
          />
          <p id={`${id}-password-help`} className="mt-1 text-xs text-muted">Tip: include upper/lowercase letters and a number.</p>
        </div>
        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-400" role="alert" aria-live="assertive">{error}</p> : null}

      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link className="text-accent hover:brightness-110" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
