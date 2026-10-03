import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecipes } from "../src/api";
import { useAuth } from "../src/auth/useAuth";

export default function RecipesPage() {
  const { retry } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchRecipes()
      .then((data) => {
        if (ignore) return;
        setRecipes(data.recipes);
        setNextCursor(data.nextCursor);
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) return retry();
        setError(err.message);
        setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [retry]);

  async function loadMore() {
    setIsLoadingMore(true);
    setError("");
    try {
      const data = await fetchRecipes(nextCursor);
      setRecipes((previous) => [...previous, ...data.recipes]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      if (err.status === 401) return retry();
      setError(err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <main className="recipes-page">
      <h1>My recipes</h1>

      {status === "loading" && <p className="recipe-status" role="status">Loading your recipes…</p>}
      {status === "error" && <p className="recipe-error" role="alert">{error}</p>}

      {status === "ready" && recipes.length === 0 && (
        <p className="recipe-status">
          You haven&apos;t saved any recipes yet. <Link to="/">Make your first one</Link>.
        </p>
      )}

      {recipes.length > 0 && (
        <ul className="recipe-list">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="recipe-card">
              <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
              <p>{recipe.description}</p>
              <span className="recipe-card-meta">
                {recipe.prepTime + recipe.cookTime} min · serves {recipe.servings} · {recipe.difficulty} ·{" "}
                {new Date(recipe.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}

      {status === "ready" && error && <p className="recipe-error" role="alert">{error}</p>}
      {nextCursor && (
        <button type="button" className="auth-button" onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}
