import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecipes } from "../src/api";
import { formatDay } from "../src/dateUtils";
import { useResource } from "../src/useResource";

export default function PlanRecipePicker({ days, onAdd, disabled }) {
  const [date, setDate] = useState(days[0]);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { isLoading, data, error, reload } = useResource(`pick-${q}`, () => fetchRecipes({ q }));

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const recipes = data?.recipes ?? [];
  const selectedDate = days.includes(date) ? date : days[0];

  const fieldClass =
    "w-full px-3 py-2.5 rounded-xl border border-warm-200 bg-warm-50/50 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition";

  return (
    <section className="my-6 p-5 rounded-2xl border border-warm-200 bg-white shadow-warm-sm" aria-labelledby="plan-picker-heading">
      <h2 id="plan-picker-heading" className="text-base font-bold text-warm-900 mb-3">
        Add a recipe
      </h2>
      <div className="flex flex-wrap gap-4 mb-3">
        <label className="flex-1 min-w-[180px] flex flex-col gap-1">
          <span className="text-xs font-semibold text-warm-700">Day</span>
          <select value={selectedDate} onChange={(event) => setDate(event.target.value)} className={fieldClass}>
            {days.map((day) => (
              <option key={day} value={day}>{formatDay(day)}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-[200px] flex flex-col gap-1">
          <span className="text-xs font-semibold text-warm-700">Find a recipe</span>
          <input
            type="search"
            value={search}
            maxLength={100}
            placeholder="Search by title or ingredient"
            onChange={(event) => setSearch(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      {isLoading && <p className="text-sm text-warm-600" role="status">Loading recipes…</p>}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-sm text-rose-700">
          <p className="mb-2">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
          >
            Try again
          </button>
        </div>
      )}
      {!isLoading && !error && recipes.length === 0 && (
        <p className="text-sm text-warm-600">
          {q ? (
            "No recipes match your search."
          ) : (
            <>
              You have no saved recipes yet.{" "}
              <Link to="/" className="text-brand-600 font-semibold hover:underline">Generate one first</Link>.
            </>
          )}
        </p>
      )}

      {!isLoading && recipes.length > 0 && (
        <ul className="list-none p-0 mt-3 max-h-[260px] overflow-y-auto">
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              className="flex items-center justify-between gap-3 py-2 border-b border-warm-100 last:border-0"
            >
              <span className="text-sm text-warm-900 truncate">{recipe.title}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Add ${recipe.title} to ${formatDay(selectedDate)}`}
                onClick={() => onAdd(recipe, selectedDate)}
                className="px-3 py-1.5 rounded-full border border-warm-200 bg-white text-xs font-bold text-warm-800 hover:border-brand-500 hover:text-brand-600 disabled:opacity-60 transition"
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}