import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import { DIFFICULTY_LABELS, formatDate } from "../src/recipeFormat";

export default function RecipeCard({ recipe, onToggleFavorite, isBusy }) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <li className="bg-white rounded-2xl border border-warm-200 p-5 shadow-warm-sm hover:shadow-warm-md transition flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/recipes/${recipe.id}`}
          className="text-lg font-bold text-warm-900 hover:text-brand-600 transition leading-tight"
        >
          {recipe.title}
        </Link>
        <FavoriteButton
          isFavorite={recipe.isFavorite}
          onToggle={() => onToggleFavorite(recipe)}
          disabled={isBusy}
          recipeTitle={recipe.title}
        />
      </div>
      <p className="text-sm text-warm-600 line-clamp-2">{recipe.description}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-warm-700">
        <span className="px-2.5 py-1 rounded-lg bg-warm-100">
          {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}
        </span>
        <span
          className="px-2.5 py-1 rounded-lg bg-warm-100"
          title={`Prep ${recipe.prepTime} min + cook ${recipe.cookTime} min`}
        >
          {totalTime} min total
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-warm-100">Serves {recipe.servings}</span>
      </div>
      <span className="text-[11px] text-warm-600 mt-auto">
        Saved <time dateTime={recipe.createdAt}>{formatDate(recipe.createdAt)}</time>
      </span>
    </li>
  );
}