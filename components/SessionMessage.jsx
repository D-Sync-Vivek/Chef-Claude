// Shown by route guards while the session is being checked or could not be checked.
export default function SessionMessage({ status, error, onRetry }) {
  if (status === "loading") {
    return (
      <main>
        <p className="auth-status" role="status">Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <div className="auth-status" role="alert">
        <p>We couldn&apos;t check your login status. {error}</p>
        <button type="button" className="auth-button" onClick={onRetry}>Try again</button>
      </div>
    </main>
  );
}
