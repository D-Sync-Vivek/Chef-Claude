import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ClaudeRecipe from "./ClaudeRecipe";
import FavoriteButton from "./FavoriteButton";
import RecipeTransformPanel from "./RecipeTransformPanel";
import { deleteRecipe, favoriteRecipe, fetchRecipeById, unfavoriteRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";
import { formatDate } from "../src/recipeFormat";

// Keyed by id so that moving from one recipe to another (e.g. to a newly saved copy)
// starts with a clean page instead of briefly showing the previous recipe.
export default function RecipeDetailPage() {
  const { id } = useParams();
  return <RecipeDetail key={id} id={id} />;
}

function RecipeDetail({ id }) {
  const { retry } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notFound | error
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchRecipeById(id)
      .then((data) => {
        if (ignore) return;
        setRecipe(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) return retry();
        // 400 (malformed id) and 404 (missing or not yours) look the same to the user.
        if (err.status === 404 || err.status === 400) return setStatus("notFound");
        setError(err.message);
        setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [id, retry]);

  async function handleToggleFavorite() {
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    setError("");
    try {
      if (recipe.isFavorite) await unfavoriteRecipe(id);
      else await favoriteRecipe(id);
      setRecipe((current) => ({ ...current, isFavorite: !current.isFavorite }));
    } catch (err) {
      if (err.status === 401) return retry();
      setError(err.message);
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  async function handleDelete() {
    if (isDeleting || !window.confirm("Delete this recipe? This cannot be undone.")) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteRecipe(id);
      navigate("/recipes", { replace: true });
    } catch (err) {
      if (err.status === 401) return retry();
      setError(err.message);
      setIsDeleting(false);
    }
  }

  return (
    <main className="recipes-page">
      <p><Link to="/recipes">← My recipes</Link></p>

      {status === "loading" && <p className="recipe-status" role="status">Loading recipe…</p>}
      {status === "notFound" && <p className="recipe-error" role="alert">Recipe not found.</p>}
      {status === "error" && <p className="recipe-error" role="alert">{error}</p>}

      {status === "ready" && (
        <>
          <div className="recipe-detail-actions">
            <FavoriteButton
              isFavorite={recipe.isFavorite}
              onToggle={handleToggleFavorite}
              disabled={isTogglingFavorite}
              recipeTitle={recipe.title}
              showText
            />
            <span className="recipe-card-meta">
              Saved <time dateTime={recipe.createdAt}>{formatDate(recipe.createdAt)}</time>
            </span>
          </div>
          <ClaudeRecipe recipe={recipe} />
          <RecipeTransformPanel recipe={recipe} onReplaced={setRecipe} />
          {error && <p className="recipe-error" role="alert">{error}</p>}
          <button type="button" className="delete-button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete recipe"}
          </button>
        </>
      )}
    </main>
  );
}
