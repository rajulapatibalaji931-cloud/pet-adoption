import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  PawPrint,
  Bell,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  HeartHandshake,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, unreadNotifications, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'ngo'
        ? '/dashboard/ngo'
        : '/dashboard/adopter';

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm group-hover:bg-emerald-700 transition-colors">
              <PawPrint className="h-5 w-5" />
            </span>
            <div>
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                Paw<span className="text-orange-600">Bridge</span>
              </span>
              <p className="text-[11px] leading-none text-slate-500 hidden sm:block">
                Verified Adoption & Care
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/pets" className={navLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Search className="h-4 w-4" />
                Find a Pet
              </span>
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to={dashboardPath} className={navLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </span>
                </NavLink>
                {(user?.role === 'adopter' || user?.role === 'ngo') && (
                  <NavLink to="/pet-care" className={navLinkClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <HeartHandshake className="h-4 w-4" />
                      Pet Care
                    </span>
                  </NavLink>
                )}
              </>
            )}
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/notifications"
                  aria-label="Notifications"
                  className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                      {user?.fullName}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700">
                      {user?.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <div className="py-1">Home</div>
          </NavLink>
          <NavLink to="/pets" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <div className="py-1">Find a Pet</div>
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to={dashboardPath}
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <div className="py-1">Dashboard</div>
              </NavLink>
              {(user?.role === 'adopter' || user?.role === 'ngo') && (
                <NavLink
                  to="/pet-care"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="py-1">Pet Care</div>
                </NavLink>
              )}
              <NavLink
                to="/notifications"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <div className="py-1 flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-xs font-bold">
                      {unreadNotifications}
                    </span>
                  )}
                </div>
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Log out ({user?.fullName})
              </button>
            </>
          ) : (
            <div className="pt-2 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
