import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ForgotPasswordPage() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await api.forgotPassword({ email });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to process request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-elevated mx-auto mt-12 max-w-md p-6">
      <h1 className="text-xl font-semibold text-ink">Forgot password</h1>
      <p className="mt-1 text-sm text-muted">Enter your account email and we will generate a reset link.</p>
      <p className="mt-2 text-xs text-muted">For security, responses stay generic even when an email is not registered.</p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="field-label" htmlFor={`${id}-email`}>Email</label>
          <input
            id={`${id}-email`}
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? 'Generating link...' : 'Send reset link'}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-400" role="alert" aria-live="assertive">{error}</p> : null}

      {result?.message ? (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-900/20 p-3 text-sm text-emerald-200">
          <p>{result.message}</p>
          {result.resetUrl ? (
            <p className="mt-2">
              Dev reset link:{' '}
              <a className="text-accent underline" href={result.resetUrl}>
                Open reset page
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-sm text-muted">
        Remembered your password?{' '}
        <Link className="text-accent hover:brightness-110" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
