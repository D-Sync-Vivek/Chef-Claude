import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth.js";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inputs are uncontrolled and read once on submit, so the password is never kept in React state.
  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError("");
    try {
      await login(form.get("email"), form.get("password"));
      // PublicOnlyRoute redirects once the session becomes authenticated.
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Log in</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </main>
  );
}
