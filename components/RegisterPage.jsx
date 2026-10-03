import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError("");
    try {
      await register(form.get("name"), form.get("email"), form.get("password"));
      // PublicOnlyRoute redirects once the session becomes authenticated.
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Create account</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" name="name" autoComplete="name" maxLength={80} required />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
          <span className="auth-hint">At least 8 characters.</span>
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}
