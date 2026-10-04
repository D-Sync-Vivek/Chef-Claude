// Heart toggle. The parent owns the state and the API call; this only displays and reports clicks.
// Accessible name is constant ("Favorite ..."); the on/off state is exposed with aria-pressed.
export default function FavoriteButton({ isFavorite, onToggle, disabled, recipeTitle, showText = false }) {
  return (
    <button
      type="button"
      className={`favorite-button${isFavorite ? " is-favorite" : ""}`}
      aria-pressed={isFavorite}
      aria-label={showText ? undefined : `Favorite ${recipeTitle}`}
      onClick={onToggle}
      disabled={disabled}
    >
      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
      {showText && <span>Favorite</span>}
    </button>
  );
}
