import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecipes } from "../src/api";
import { formatDay } from "../src/dateUtils";
import { useResource } from "../src/useResource";

// "Add a recipe to a day": choose the day, search your recipes, press Add.
export default function PlanRecipePicker({ days, onAdd, disabled }) {
  const [date, setDate] = useState(days[0]);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced
  const { isLoading, data, error, reload } = useResource(`pick-${q}`, () => fetchRecipes({ q }));

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const recipes = data?.recipes ?? [];
  const selectedDate = days.includes(date) ? date : days[0];

  return (
    <section className="plan-picker" aria-labelledby="plan-picker-heading">
      <h2 id="plan-picker-heading">Add a recipe</h2>
      <div className="plan-picker-controls">
        <label>
          Day
          <select value={selectedDate} onChange={(event) => setDate(event.target.value)}>
            {days.map((day) => (
              <option key={day} value={day}>{formatDay(day)}</option>
            ))}
          </select>
        </label>
        <label>
          Find a recipe
          <input type="search" value={search} maxLength={100} placeholder="Search by title or ingredient"
            onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>

      {isLoading && <p className="recipe-status" role="status">Loading recipes…</p>}
      {!isLoading && error && (
        <div className="recipe-error" role="alert">
          <p>{error}</p>
          <button type="button" className="auth-button" onClick={reload}>Try again</button>
        </div>
      )}
      {!isLoading && !error && recipes.length === 0 && (
        <p className="recipe-status">
          {q ? "No recipes match your search." : <>You have no saved recipes yet. <Link to="/">Generate one first</Link>.</>}
        </p>
      )}

      {!isLoading && recipes.length > 0 && (
        <ul className="plan-picker-results">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <span>{recipe.title}</span>
              <button type="button" className="chip" disabled={disabled}
                aria-label={`Add ${recipe.title} to ${formatDay(selectedDate)}`}
                onClick={() => onAdd(recipe, selectedDate)}>
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
