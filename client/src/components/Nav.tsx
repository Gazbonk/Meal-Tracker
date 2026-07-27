import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
    isActive ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
  }`;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Nav() {
  const { user, household, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/70">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 mr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base shadow-soft">
              🍽️
            </span>
            <span className="font-semibold text-gray-800 hidden sm:inline tracking-tight">
              Hornsby Meal Tracker
            </span>
          </div>
          <NavLink to="/" end className={linkClass}>
            Calendar
          </NavLink>
          <NavLink to="/recipes" className={linkClass}>
            Recipes
          </NavLink>
          <NavLink to="/shopping-list" className={linkClass}>
            Shopping List
          </NavLink>
          {user?.isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>
        <div className="flex items-center gap-3">
          {household && <span className="hidden md:inline text-sm text-gray-400">{household.name}</span>}
          {user && (
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                {initials(user.name)}
              </span>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
