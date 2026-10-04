import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";
import { DIFFICULTY_LABELS, formatDate } from "../src/recipeFormat";

export default function RecipeCard({ recipe, onToggleFavorite, isBusy }) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <li className="recipe-card">
      <div className="recipe-card-top">
        <Link to={`/recipes/${recipe.id}`} className="recipe-card-title">{recipe.title}</Link>
        <FavoriteButton
          isFavorite={recipe.isFavorite}
          onToggle={() => onToggleFavorite(recipe)}
          disabled={isBusy}
          recipeTitle={recipe.title}
        />
      </div>
      <p className="recipe-card-description">{recipe.description}</p>
      <ul className="recipe-meta">
        <li>{DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}</li>
        <li title={`Prep ${recipe.prepTime} min + cook ${recipe.cookTime} min`}>{totalTime} min total</li>
        <li>Serves {recipe.servings}</li>
      </ul>
      <span className="recipe-card-meta">
        Saved <time dateTime={recipe.createdAt}>{formatDate(recipe.createdAt)}</time>
      </span>
    </li>
  );
}
