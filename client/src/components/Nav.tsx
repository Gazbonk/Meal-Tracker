import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3.5 py-1.5 rounded text-sm font-medium transition-colors ${
    isActive ? "bg-sageDeep text-white" : "text-muted hover:bg-surface"
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
    <nav className="sticky top-0 z-10 bg-canvas/90 backdrop-blur-md border-b border-line">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 mr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-sageDeep text-base">
              🍽️
            </span>
            <span className="font-display font-semibold text-ink hidden sm:inline tracking-tight">
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
          {user?.isSuperAdmin && (
            <NavLink to="/households" className={linkClass}>
              Households
            </NavLink>
          )}
        </div>
        <div className="flex items-center gap-3">
          {household && (
            <span className="hidden lg:inline font-mono text-xs text-muted whitespace-nowrap truncate max-w-[10rem]">
              {household.name}
            </span>
          )}
          {user && (
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage text-sageDeep text-xs font-semibold">
                {initials(user.name)}
              </span>
              <span className="text-sm font-medium text-ink hidden sm:inline">{user.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="text-sm text-muted hover:text-ink transition-colors px-2 py-1 rounded hover:bg-surface"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
