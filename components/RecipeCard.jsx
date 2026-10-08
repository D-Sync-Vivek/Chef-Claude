import { Link } from "react-router-dom";
import { DIFFICULTY_LABELS } from "../src/recipeFormat";

const DIFFICULTY_STYLE = {
  easy: {
    badge: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  medium: {
    badge: "text-brand-600",
    dot: "bg-brand-500",
  },
  hard: {
    badge: "text-rose-700",
    dot: "bg-rose-500",
  },
};

// Warm gradient placeholder per difficulty (no image URLs on the backend yet).
const DIFFICULTY_GRADIENT = {
  easy: "from-emerald-100 via-warm-100 to-brand-100",
  medium: "from-brand-100 via-warm-100 to-amber-100",
  hard: "from-rose-100 via-warm-100 to-brand-100",
};

const DIFFICULTY_EMOJI = {
  easy: "🥗",
  medium: "🍲",
  hard: "🔥",
};

export default function RecipeCard({ recipe, onToggleFavorite, isBusy }) {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const style = DIFFICULTY_STYLE[recipe.difficulty] ?? DIFFICULTY_STYLE.medium;
  const gradient = DIFFICULTY_GRADIENT[recipe.difficulty] ?? DIFFICULTY_GRADIENT.medium;
  const emoji = DIFFICULTY_EMOJI[recipe.difficulty] ?? "🍽️";

  return (
    <article className="group bg-white rounded-2xl overflow-hidden shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1 transition duration-200 flex flex-col">
      <Link
        to={`/recipes/${recipe.id}`}
        className={`relative w-full aspect-[4/3] bg-gradient-to-br ${gradient} overflow-hidden flex items-center justify-center`}
        aria-label={recipe.title}
      >
        <span className="text-5xl opacity-80 group-hover:scale-110 transition duration-300 select-none">
          {emoji}
        </span>
        <div
          className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm flex items-center gap-1.5 text-[11px] font-semibold ${style.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span>{DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}</span>
        </div>
      </Link>

      <button
        type="button"
        aria-label={recipe.isFavorite ? `Unfavorite ${recipe.title}` : `Favorite ${recipe.title}`}
        aria-pressed={recipe.isFavorite}
        onClick={() => onToggleFavorite(recipe)}
        disabled={isBusy}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm shadow-md flex items-center justify-center transition hover:scale-110 active:scale-95 disabled:opacity-60 ${
          recipe.isFavorite
            ? "bg-white/95 text-brand-600"
            : "bg-white/90 text-warm-600 hover:text-brand-600"
        }`}
        style={{ position: "absolute" }}
      >
        <span
          className="material-symbols-outlined text-xl"
          style={recipe.isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {recipe.isFavorite ? "favorite" : "favorite_border"}
        </span>
      </button>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <Link to={`/recipes/${recipe.id}`} className="block">
            <h3 className="text-base font-bold text-warm-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {recipe.title}
            </h3>
          </Link>
          <p className="text-xs text-warm-600 line-clamp-2">{recipe.description}</p>
        </div>

        <div className="pt-2 flex items-center justify-between text-warm-600 text-xs font-semibold">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-warm-600 text-base">schedule</span>
            <span>{totalTime} mins</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-warm-600 text-base">group</span>
            <span>{recipe.servings} serv.</span>
          </div>
          <Link to={`/recipes/${recipe.id}`} aria-label={`Open ${recipe.title}`}>
            <span className="material-symbols-outlined text-brand-600 text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}