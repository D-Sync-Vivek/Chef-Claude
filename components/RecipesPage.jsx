import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RecipeCard from "./RecipeCard";
import { favoriteRecipe, fetchFavorites, fetchRecipes, unfavoriteRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";

const SEARCH_DEBOUNCE_MS = 300;

// The recipe library. With favoritesOnly it shows the Favorites view instead of all recipes.
export default function RecipesPage({ favoritesOnly = false }) {
  const { retry } = useAuth();
  const loadList = favoritesOnly ? fetchFavorites : fetchRecipes;

  const [search, setSearch] = useState(""); // what is typed
  const [q, setQ] = useState(""); // what is sent to the server (debounced)
  const [difficulty, setDifficulty] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // `result.key` records which request the data belongs to. While it differs from the current
  // request key, the page is loading - so no state has to be reset inside the effect.
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
        if (!ignore) setResult({ key: requestKey, recipes: data.recipes, nextCursor: data.nextCursor, error: "" });
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
      setResult((previous) => ({ ...previous, recipes: [...previous.recipes, ...data.recipes], nextCursor: data.nextCursor }));
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

      setResult((previous) => ({
        ...previous,
        // In the Favorites view, un-favoriting removes the card.
        recipes:
          favoritesOnly && recipe.isFavorite
            ? previous.recipes.filter((item) => item.id !== recipe.id)
            : previous.recipes.map((item) =>
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
    <main className="recipes-page">
      <h1>{favoritesOnly ? "Favorites" : "My recipes"}</h1>

      <form className="library-filters" role="search" onSubmit={(event) => { event.preventDefault(); setQ(search.trim()); }}>
        <input
          type="search"
          aria-label="Search recipes"
          placeholder="Search by title or ingredient"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {hasFilters && (
          <button type="button" className="link-button" onClick={clearFilters}>Clear filters</button>
        )}
      </form>

      {isLoading && <p className="recipe-status" role="status">Loading your recipes…</p>}

      {!isLoading && result.error && (
        <div className="recipe-error" role="alert">
          <p>{result.error}</p>
          <button type="button" className="auth-button" onClick={() => setReloadCount((count) => count + 1)}>
            Try again
          </button>
        </div>
      )}

      {showEmpty && hasFilters && <p className="recipe-status">No recipes match your search.</p>}
      {showEmpty && !hasFilters && favoritesOnly && (
        <p className="recipe-status">
          No favorites yet. Tap the heart on a recipe to keep it here. <Link to="/recipes">Browse my recipes</Link>
        </p>
      )}
      {showEmpty && !hasFilters && !favoritesOnly && (
        <p className="recipe-status">
          You haven&apos;t saved any recipes yet. <Link to="/">Make your first one</Link>.
        </p>
      )}

      {actionError && <p className="recipe-error" role="alert">{actionError}</p>}

      {!isLoading && result.recipes.length > 0 && (
        <ul className="recipe-list">
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
        <button type="button" className="auth-button" onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}
