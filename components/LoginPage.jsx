import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth.js";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setError("");
    try {
      await login(form.get("email"), form.get("password"));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm bg-warm-50/50 outline-none transition";

  return (
    <main className="flex-grow flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-warm-200 shadow-warm-lg p-8">
        <h1 className="text-2xl font-extrabold text-warm-900 text-center">Log in</h1>
        <p className="text-xs text-warm-600 text-center mt-1">Welcome back to Chef Claude.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-semibold text-warm-700">Email</span>
            <input type="email" name="email" autoComplete="email" required className={inputClass} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-warm-700">Password</span>
            <input type="password" name="password" autoComplete="current-password" required className={inputClass} />
          </label>
          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 text-white font-bold text-sm transition"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-xs text-center text-warm-600 mt-6">
          New here?{" "}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}