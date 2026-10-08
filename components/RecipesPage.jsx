import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RecipeCard from "./RecipeCard";
import { favoriteRecipe, fetchFavorites, fetchRecipes, unfavoriteRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";

const SEARCH_DEBOUNCE_MS = 300;

export default function RecipesPage({ favoritesOnly = false }) {
  const { retry } = useAuth();
  const loadList = favoritesOnly ? fetchFavorites : fetchRecipes;

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const requestKey = `${favoritesOnly}|${q}|${difficulty}|${reloadCount}`;
  const [result, setResult] = useState({ key: null, recipes: [], nextCursor: null, error: "" });
  const isLoading = result.key !== requestKey;

  const [busyIds, setBusyIds] = useState([]);
  const [actionError, setActionError] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    loadList({ q, difficulty })
      .then((data) => {
        if (!ignore)
          setResult({ key: requestKey, recipes: data.recipes, nextCursor: data.nextCursor, error: "" });
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) return retry();
        setResult({ key: requestKey, recipes: [], nextCursor: null, error: err.message });
      });
    return () => {
      ignore = true;
    };
  }, [requestKey, loadList, q, difficulty, retry]);

  async function loadMore() {
    setIsLoadingMore(true);
    setActionError("");
    try {
      const data = await loadList({ q, difficulty, cursor: result.nextCursor });
      setResult((prev) => ({
        ...prev,
        recipes: [...prev.recipes, ...data.recipes],
        nextCursor: data.nextCursor,
      }));
    } catch (err) {
      if (err.status === 401) return retry();
      setActionError(err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function toggleFavorite(recipe) {
    if (busyIds.includes(recipe.id)) return;
    setBusyIds((ids) => [...ids, recipe.id]);
    setActionError("");
    try {
      if (recipe.isFavorite) await unfavoriteRecipe(recipe.id);
      else await favoriteRecipe(recipe.id);

      setResult((prev) => ({
        ...prev,
        recipes:
          favoritesOnly && recipe.isFavorite
            ? prev.recipes.filter((item) => item.id !== recipe.id)
            : prev.recipes.map((item) =>
                item.id === recipe.id ? { ...item, isFavorite: !recipe.isFavorite } : item
              ),
      }));
    } catch (err) {
      if (err.status === 401) return retry();
      setActionError(err.message);
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== recipe.id));
    }
  }

  function clearFilters() {
    setSearch("");
    setQ("");
    setDifficulty("");
  }

  const hasFilters = q !== "" || difficulty !== "" || search !== "";
  const showEmpty = !isLoading && !result.error && result.recipes.length === 0;

  return (
    <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-warm-900">
        {favoritesOnly ? "Favorites" : "My Recipes"}
      </h1>

      <form
        className="mt-5 mb-6 flex flex-wrap items-center gap-3"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setQ(search.trim());
        }}
      >
        <input
          type="search"
          aria-label="Search recipes"
          placeholder="Search by title or ingredient"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm bg-white placeholder:text-warm-600 outline-none transition"
        />
        <select
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          className="px-3 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-brand-600 hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </form>

      {isLoading && (
        <p className="text-sm text-warm-600 text-center py-6" role="status">
          Loading your recipes…
        </p>
      )}

      {!isLoading && result.error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center text-sm text-rose-700">
          <p className="mb-3">{result.error}</p>
          <button
            type="button"
            onClick={() => setReloadCount((c) => c + 1)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
          >
            Try again
          </button>
        </div>
      )}

      {showEmpty && hasFilters && (
        <p className="text-sm text-warm-600 text-center py-6">No recipes match your search.</p>
      )}
      {showEmpty && !hasFilters && favoritesOnly && (
        <p className="text-sm text-warm-600 text-center py-6">
          No favorites yet. Tap the heart on a recipe to keep it here.{" "}
          <Link to="/recipes" className="text-brand-600 font-semibold hover:underline">
            Browse my recipes
          </Link>
        </p>
      )}
      {showEmpty && !hasFilters && !favoritesOnly && (
        <p className="text-sm text-warm-600 text-center py-6">
          You haven&apos;t saved any recipes yet.{" "}
          <Link to="/" className="text-brand-600 font-semibold hover:underline">
            Make your first one
          </Link>
          .
        </p>
      )}

      {actionError && (
        <p className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mb-4" role="alert">
          {actionError}
        </p>
      )}

      {!isLoading && result.recipes.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
          {result.recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onToggleFavorite={toggleFavorite}
              isBusy={busyIds.includes(recipe.id)}
            />
          ))}
        </ul>
      )}

      {!isLoading && result.nextCursor && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-xs font-bold transition"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}