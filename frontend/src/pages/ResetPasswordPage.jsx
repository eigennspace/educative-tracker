import { useId, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ResetPasswordPage() {
  const id = useId();
  const location = useLocation();
  const queryToken = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await api.resetPassword({ token, newPassword });
      setSuccess(data?.message || 'Password reset successful.');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-elevated mx-auto mt-12 max-w-md p-6">
      <h1 className="text-xl font-semibold text-ink">Reset password</h1>
      <p className="mt-1 text-sm text-muted">Paste your reset token and set a new password.</p>
      <p className="mt-2 text-xs text-muted">Reset tokens are single-use and expire after a short period.</p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="field-label" htmlFor={`${id}-token`}>Reset token</label>
          <input
            id={`${id}-token`}
            className="input"
            type="text"
            placeholder="Paste token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            aria-describedby={`${id}-token-help`}
            required
          />
          <p id={`${id}-token-help`} className="mt-1 text-xs text-muted">Token comes from your reset email or dev reset URL.</p>
        </div>
        <div>
          <label className="field-label" htmlFor={`${id}-password`}>New password</label>
          <input
            id={`${id}-password`}
            className="input"
            type="password"
            minLength={8}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            aria-describedby={`${id}-password-help`}
            required
          />
          <p id={`${id}-password-help`} className="mt-1 text-xs text-muted">Use at least 8 characters with mixed character types.</p>
        </div>
        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? 'Updating password...' : 'Reset password'}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-400" role="alert" aria-live="assertive">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-300" role="status" aria-live="polite">{success}</p> : null}

      <p className="mt-4 text-sm text-muted">
        Back to{' '}
        <Link className="text-accent hover:brightness-110" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
