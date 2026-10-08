import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RecipeCard from "./RecipeCard";
import { favoriteRecipe, fetchFavorites, fetchRecipes, unfavoriteRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";

const SEARCH_DEBOUNCE_MS = 300;

const DIFFICULTIES = [
  { value: "", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "alpha", label: "Alphabetical (A-Z)" },
  { value: "fastest", label: "Fastest cook time" },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-warm-sm flex flex-col animate-pulse">
      <div className="w-full aspect-[4/3] bg-warm-100" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-warm-100 rounded-md w-3/4" />
        <div className="h-3.5 bg-warm-100 rounded-md w-full" />
        <div className="h-3.5 bg-warm-100 rounded-md w-2/3" />
        <div className="pt-2 flex justify-between">
          <div className="h-4 bg-warm-100 rounded-md w-16" />
          <div className="h-4 bg-warm-100 rounded-md w-14" />
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage({ favoritesOnly = false }) {
  const { retry } = useAuth();
  const navigate = useNavigate();
  const loadList = favoritesOnly ? fetchFavorites : fetchRecipes;

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("newest");
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

  const sortedRecipes = useMemo(() => {
    const list = [...result.recipes];
    if (sort === "oldest") return list.reverse();
    if (sort === "alpha") return list.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "fastest")
      return list.sort(
        (a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime)
      );
    return list;
  }, [result.recipes, sort]);

  const favoriteCount = useMemo(
    () => result.recipes.filter((r) => r.isFavorite).length,
    [result.recipes]
  );

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
  const showEmpty = !isLoading && !result.error && sortedRecipes.length === 0;

  return (
    <main className="flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">
        {/* Editorial header + stats */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-100 text-warm-600 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Personal Culinary Library
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-warm-900 tracking-tight">
              {favoritesOnly ? "Favorites" : "My Recipes"}
            </h1>
            <p className="text-sm sm:text-base text-warm-600 max-w-xl">
              {favoritesOnly
                ? "Your favourite saved and AI-crafted recipes in one curated spot."
                : "All your saved and AI-crafted culinary recipes in one curated spot. Search, filter, and plan tonight's dinner effortlessly."}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-warm-100 p-2 rounded-2xl shadow-warm-sm self-start md:self-auto">
            <div className="px-4 py-2 rounded-xl bg-white shadow-warm-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-brand-600 text-2xl">menu_book</span>
              <div>
                <p className="text-[10px] text-warm-600 uppercase tracking-wider">Total Recipes</p>
                <p className="text-lg font-bold text-warm-900 leading-none">
                  {isLoading ? "—" : result.recipes.length}
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white shadow-warm-sm flex items-center gap-3">
              <span
                className="material-symbols-outlined text-brand-600 text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              <div>
                <p className="text-[10px] text-warm-600 uppercase tracking-wider">Favorites</p>
                <p className="text-lg font-bold text-warm-900 leading-none">
                  {isLoading ? "—" : favoriteCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-warm-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 min-w-[280px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-600 text-xl pointer-events-none">
                search
              </span>
              <input
                type="search"
                aria-label="Search recipes"
                placeholder="Search recipes, ingredients, tags..."
                value={search}
                maxLength={100}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-warm-100 text-warm-900 placeholder:text-warm-600 rounded-xl text-sm outline-none focus:bg-white focus:shadow-warm-md transition"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-warm-100 p-1 rounded-xl">
                {DIFFICULTIES.map((option) => {
                  const active = difficulty === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDifficulty(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        active
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-warm-600 hover:text-warm-900"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => navigate(favoritesOnly ? "/recipes" : "/favorites")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  favoritesOnly
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-warm-100 hover:bg-warm-200 text-warm-600"
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={favoritesOnly ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {favoritesOnly ? "favorite" : "favorite_border"}
                </span>
                <span>Favorites</span>
              </button>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="appearance-none bg-warm-100 hover:bg-warm-200 text-warm-900 text-xs font-semibold pl-3.5 pr-8 py-2 rounded-xl outline-none cursor-pointer transition"
                  aria-label="Sort recipes"
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-600 text-base pointer-events-none">
                  expand_more
                </span>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-brand-600 text-xs font-semibold hover:underline px-2 py-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-warm-600 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-500 text-base">dinner_dining</span>
              <span>
                Showing <strong className="text-warm-900">{sortedRecipes.length}</strong>{" "}
                {sortedRecipes.length === 1 ? "recipe" : "recipes"}
              </span>
            </div>
          </div>
        </section>

        {/* States */}
        {actionError && (
          <p className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3" role="alert">
            {actionError}
          </p>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && result.error && (
          <div className="flex flex-col items-center justify-center p-12 bg-rose-50 border border-rose-200 rounded-2xl shadow-warm-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <span className="material-symbols-outlined text-3xl">cloud_off</span>
            </div>
            <h3 className="text-xl font-bold text-warm-900 mb-2">Failed to load recipes</h3>
            <p className="text-sm text-warm-600 max-w-md mb-6">{result.error}</p>
            <button
              type="button"
              onClick={() => setReloadCount((c) => c + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Retry Loading</span>
            </button>
          </div>
        )}

        {/* Empty */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-warm-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center text-brand-600 mb-4">
              <span className="material-symbols-outlined text-3xl">skillet</span>
            </div>
            <h3 className="text-xl font-bold text-warm-900 mb-2">
              {hasFilters ? "No recipes found" : favoritesOnly ? "No favorites yet" : "No recipes yet"}
            </h3>
            <p className="text-sm text-warm-600 max-w-md mb-6">
              {hasFilters
                ? "We couldn't find any recipes matching your current filter criteria. Try adjusting your search keyword or clearing the filters."
                : favoritesOnly
                ? "Tap the heart on a recipe to keep it here for quick access."
                : "Generate your first recipe and it will show up here."}
            </p>
            <div className="flex items-center gap-3">
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition"
                >
                  Clear All Filters
                </button>
              ) : (
                <Link
                  to={favoritesOnly ? "/recipes" : "/"}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition"
                >
                  {favoritesOnly ? "Browse my recipes" : "Make your first one"}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !result.error && sortedRecipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={toggleFavorite}
                isBusy={busyIds.includes(recipe.id)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!isLoading && !result.error && result.nextCursor && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white rounded-2xl shadow-warm-sm">
            <span className="text-xs text-warm-600">
              Showing <strong className="text-warm-900">{sortedRecipes.length}</strong> loaded recipes
            </span>
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 disabled:opacity-60 text-warm-900 text-xs font-bold shadow-warm-sm transition"
            >
              <span className="material-symbols-outlined text-lg">
                {isLoadingMore ? "hourglass_top" : "add"}
              </span>
              <span>{isLoadingMore ? "Loading…" : "Load More Recipes"}</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}