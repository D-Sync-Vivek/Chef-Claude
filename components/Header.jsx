import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth.js";
import { ChefLogo } from "./LandingPage.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Generate", end: true },
  { to: "/recipes", label: "My Recipes" },
  { to: "/favorites", label: "Favorites" },
  { to: "/meal-plans", label: "Meal Planner" },
  { to: "/shopping-lists", label: "Shopping Lists" },
];

export default function Header() {
  const { status, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
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

  const isAuthenticated = status === "authenticated";

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-warm-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0" onClick={() => setMenuOpen(false)}>
          <ChefLogo />
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-warm-900 group-hover:text-brand-600 transition-colors">
              Chef Claude
            </span>
            <span className="hidden sm:block text-[10px] tracking-wider uppercase font-semibold text-brand-600 -mt-1">
              Culinary AI Assistant
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && (
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
              {/* On phones, logout lives inside the menu. */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:inline text-xs text-warm-600 hover:text-brand-600 font-medium hover:underline"
              >
                Log out
              </button>

              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-warm-200 bg-white text-warm-800 hover:bg-warm-100 transition"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </>
          )}
          {(status === "unauthenticated" || status === "error") && (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-warm-600 hover:text-warm-900 px-2 sm:px-3 py-2"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 px-3 sm:px-4 py-2 rounded-xl transition whitespace-nowrap"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Desktop / tablet navigation */}
      {isAuthenticated && (
        <nav
          className="hidden md:flex flex-wrap items-center justify-center gap-1 px-4 pb-3"
          aria-label="Main"
        >
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3.5 py-1.5 text-sm rounded-full transition whitespace-nowrap ${
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

      {/* Mobile navigation (below md) */}
      {isAuthenticated && menuOpen && (
        <nav
          id="mobile-nav"
          className="md:hidden border-t border-warm-200/80 bg-[#FAF8F5] px-4 pt-3 pb-4 shadow-warm-md"
          aria-label="Main"
        >
          <div className="flex items-center gap-3 px-1 pb-3 mb-2 border-b border-warm-200/80">
            <div className="w-9 h-9 rounded-full bg-warm-200 border border-warm-300 flex items-center justify-center font-bold text-warm-800 text-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-warm-900 leading-tight truncate">{user.name}</p>
              <p className="text-[11px] text-warm-600 leading-none mt-0.5">Home Cook</p>
            </div>
          </div>

          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3.5 py-2.5 text-sm rounded-xl transition ${
                      isActive
                        ? "text-brand-600 bg-brand-50 font-semibold"
                        : "text-warm-800 font-medium hover:bg-warm-100"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full px-3.5 py-2.5 text-sm font-semibold text-brand-600 border border-warm-200 bg-white rounded-xl hover:bg-brand-50 transition"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}