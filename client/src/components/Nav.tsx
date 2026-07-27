import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
  }`;

export default function Nav() {
  const { user, household, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-bold text-brand-700 mr-3">🍽️ Hornsby Meal Tracker</span>
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
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {household && <span className="hidden sm:inline">{household.name}</span>}
          {user && <span className="font-medium text-gray-700">{user.name}</span>}
          <button onClick={logout} className="text-gray-400 hover:text-gray-700">
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
