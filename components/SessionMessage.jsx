export default function SessionMessage({ status, error, onRetry }) {
  if (status === "loading") {
    return (
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <p className="text-sm text-warm-600" role="status">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center px-4 py-12">
      <div
        className="max-w-md w-full bg-white rounded-3xl border border-warm-200 shadow-warm-lg p-8 text-center"
        role="alert"
      >
        <p className="text-sm text-warm-700">We couldn&apos;t check your login status. {error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition"
        >
          Try again
        </button>
      </div>
    </main>
  );
}