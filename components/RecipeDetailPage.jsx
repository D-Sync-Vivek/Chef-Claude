import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ClaudeRecipe from "./ClaudeRecipe";
import FavoriteButton from "./FavoriteButton";
import RecipeTransformPanel from "./RecipeTransformPanel";
import { deleteRecipe, favoriteRecipe, fetchRecipeById, unfavoriteRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";
import { formatDate } from "../src/recipeFormat";

export default function RecipeDetailPage() {
  const { id } = useParams();
  return <RecipeDetail key={id} id={id} />;
}

function RecipeDetail({ id }) {
  const { retry } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [status, setStatus] = useState("loading");
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
    <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <p className="mb-4">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-warm-600 hover:text-warm-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Recipes
        </Link>
      </p>

      {status === "loading" && (
        <p className="text-sm text-warm-600 text-center py-6" role="status">
          Loading recipe…
        </p>
      )}
      {status === "notFound" && (
        <p className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4 text-center" role="alert">
          Recipe not found.
        </p>
      )}
      {status === "error" && (
        <p className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4 text-center" role="alert">
          {error}
        </p>
      )}

      {status === "ready" && (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <FavoriteButton
              isFavorite={recipe.isFavorite}
              onToggle={handleToggleFavorite}
              disabled={isTogglingFavorite}
              recipeTitle={recipe.title}
              showText
            />
            <span className="text-xs text-warm-600">
              Saved <time dateTime={recipe.createdAt}>{formatDate(recipe.createdAt)}</time>
            </span>
          </div>

          <ClaudeRecipe recipe={recipe} />

          <RecipeTransformPanel recipe={recipe} onReplaced={setRecipe} />

          {error && (
            <p className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mt-4" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-60 text-xs font-bold transition"
            >
              {isDeleting ? "Deleting…" : "Delete recipe"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}