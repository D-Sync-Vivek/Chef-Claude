import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth.js";

export default function Header() {
  const { status, user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      alert(err.message || "Failed to log out");
    }
  }

  const initials =
    (user?.name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-warm-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" x2="18" y1="17" y2="17" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-warm-900 group-hover:text-brand-600 transition-colors">
              Chef Claude
            </span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-brand-600 -mt-1">
              Culinary AI Assistant
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {status === "authenticated" && (
            <>
              <div className="hidden lg:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-warm-200 border border-warm-300 flex items-center justify-center font-bold text-warm-800 text-xs">
                  {initials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-warm-900 leading-tight">{user.name}</p>
                  <p className="text-[11px] text-warm-600 leading-none">Home Cook</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-warm-600 hover:text-brand-600 font-medium hover:underline"
              >
                Log out
              </button>
            </>
          )}
          {(status === "unauthenticated" || status === "error") && (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-warm-600 hover:text-warm-900 px-3 py-2"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-xl transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {status === "authenticated" && (
        <nav
          className="hidden md:flex items-center justify-center gap-1 px-4 pb-3"
          aria-label="Main"
        >
          {[
            { to: "/", label: "Generate", end: true },
            { to: "/recipes", label: "My Recipes" },
            { to: "/favorites", label: "Favorites" },
            { to: "/meal-plans", label: "Meal Planner" },
            { to: "/shopping-lists", label: "Shopping Lists" },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3.5 py-1.5 text-sm rounded-full transition ${
                  isActive
                    ? "text-brand-600 bg-brand-50 font-semibold"
                    : "text-warm-600 font-medium hover:text-warm-900 hover:bg-warm-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}