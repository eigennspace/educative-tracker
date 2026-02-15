import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/sessions', label: 'Sessions' }
];

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-panel/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink md:text-xl">Educative Tracker</h1>
          <p className="text-xs text-muted md:text-sm">Local-first learning progress companion</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <nav className="flex flex-wrap gap-1 rounded-lg border border-line p-1" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm transition ${isActive ? 'bg-accent text-slate-900' : 'text-muted hover:bg-slate-800/60 hover:text-ink'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto text-right md:ml-0">
            <p className="max-w-[16rem] truncate text-xs text-muted">{user?.email || 'Signed in'}</p>
            <button
              className="text-xs text-accent transition hover:brightness-110"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
