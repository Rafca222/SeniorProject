import { Link, useLocation } from 'react-router-dom';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        active ? 'text-ink-900 font-semibold' : 'text-ink-500 hover:text-ink-800'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar({ isLoggedIn, onLogout }) {
  return (
    <header className="border-b border-ink-100 bg-[#F6EEE0]/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0">
          <span className="font-display italic font-semibold text-2xl text-clay-600 tracking-tight">
            Eventure
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-7">
          <NavLink to="/">Discover</NavLink>
          {isLoggedIn && <NavLink to="/events/new">Create event</NavLink>}
          {isLoggedIn && <NavLink to="/settings">Settings</NavLink>}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <button onClick={onLogout} className="text-sm font-semibold text-ink-600 hover:text-ink-900">
              Log out
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink-700 hover:text-ink-900">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="sm:hidden flex items-center gap-5 px-4 pb-3 -mt-1 overflow-x-auto scrollbar-hide">
        <NavLink to="/">Discover</NavLink>
        {isLoggedIn && <NavLink to="/events/new">Create event</NavLink>}
        {isLoggedIn && <NavLink to="/settings">Settings</NavLink>}
      </nav>
    </header>
  );
}
