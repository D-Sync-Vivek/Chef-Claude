import { Link } from "react-router-dom";
import chefClaude from "../src/assets/chef-claude-icon.png";
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

  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <img className="header-image" src={chefClaude} alt="chef claude image" />
        <span className="header-name">Chef Claude</span>
      </Link>

      <nav className="header-auth" aria-label="Account">
        {status === "authenticated" && (
          <>
            <span className="header-user">Hi, {user.name}</span>
            <button type="button" className="header-link-button" onClick={handleLogout}>
              Log out
            </button>
          </>
        )}
        {(status === "unauthenticated" || status === "error") && (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
