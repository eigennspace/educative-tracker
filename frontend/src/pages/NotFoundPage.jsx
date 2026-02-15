import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const fallbackTo = isAuthenticated ? '/dashboard' : '/login';
  const fallbackLabel = isAuthenticated ? 'Go to dashboard' : 'Go to sign in';

  return (
    <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-line bg-panel/90 p-8 text-center shadow-[0_20px_60px_-35px_rgba(0,0,0,0.9)]">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-3 text-sm text-muted">
        The link might be outdated or the page was moved.
      </p>
      <Link className="btn mt-6 inline-block" to={fallbackTo}>
        {fallbackLabel}
      </Link>
    </div>
  );
}
