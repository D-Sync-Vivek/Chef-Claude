export default function FavoriteButton({
  isFavorite,
  onToggle,
  disabled,
  recipeTitle,
  showText = false,
}) {
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={showText ? undefined : `Favorite ${recipeTitle}`}
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition disabled:opacity-60 disabled:cursor-not-allowed ${
        isFavorite
          ? "border-rose-300 bg-rose-600 text-white shadow-sm"
          : "border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100"
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      {showText && <span>{isFavorite ? "Favorited" : "Favorite"}</span>}
    </button>
  );
}