import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PlanRecipePicker from "./PlanRecipePicker";
import {
  addMealPlanEntry,
  createShoppingList,
  deleteMealPlan,
  deleteMealPlanEntry,
  fetchMealPlan,
  updateMealPlan,
  updateMealPlanEntry,
} from "../src/api";
import { useAuth } from "../src/auth/useAuth";
import { eachDay, formatDay, formatRange } from "../src/dateUtils";
import { useResource } from "../src/useResource";

export default function MealPlanPage() {
  const { id } = useParams();
  return <MealPlanView key={id} id={id} />;
}

const byDate = (entries) => [...entries].sort((a, b) => a.date.localeCompare(b.date));

function MealPlanView({ id }) {
  const navigate = useNavigate();
  const { retry } = useAuth();
  const { isLoading, data: plan, error, status, reload, setData } = useResource(`plan-${id}`, () => fetchMealPlan(id));

  const [busy, setBusy] = useState([]);
  const [actionError, setActionError] = useState("");
  const [excluded, setExcluded] = useState([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  async function run(busyKey, action) {
    setBusy((keys) => [...keys, busyKey]);
    setActionError("");
    try {
      return { ok: true, value: await action() };
    } catch (err) {
      if (err.status === 401) retry();
      else setActionError(err.message);
      return { ok: false };
    } finally {
      setBusy((keys) => keys.filter((key) => key !== busyKey));
    }
  }

  async function addRecipe(recipe, date) {
    const result = await run("add", () => addMealPlanEntry(id, { recipeId: recipe.id, date }));
    if (result.ok) setData((current) => ({ ...current, entries: byDate([...current.entries, result.value]) }));
  }

  async function moveEntry(entry, date) {
    if (date === entry.date) return;
    const result = await run(entry.id, () => updateMealPlanEntry(id, entry.id, { date }));
    if (result.ok) {
      setData((current) => ({
        ...current,
        entries: byDate(current.entries.map((item) => (item.id === entry.id ? result.value : item))),
      }));
    }
  }

  async function removeEntry(entry) {
    const result = await run(entry.id, () => deleteMealPlanEntry(id, entry.id));
    if (result.ok) setData((current) => ({ ...current, entries: current.entries.filter((item) => item.id !== entry.id) }));
  }

  async function saveName(event) {
    event.preventDefault();
    const result = await run("rename", () => updateMealPlan(id, { name: nameDraft.trim() }));
    if (result.ok) {
      setData(result.value);
      setIsRenaming(false);
    }
  }

  async function removePlan() {
    if (!window.confirm("Delete this meal plan? Shopping lists you already made from it are kept.")) return;
    const result = await run("delete", () => deleteMealPlan(id));
    if (result.ok) navigate("/meal-plans", { replace: true });
  }

  async function makeShoppingList() {
    const selected = plan.entries.filter((entry) => !excluded.includes(entry.id));
    const allSelected = selected.length === plan.entries.length;
    const result = await run("shop", () =>
      createShoppingList({ mealPlanId: id, ...(allSelected ? {} : { entryIds: selected.map((entry) => entry.id) }) })
    );
    if (result.ok) navigate(`/shopping-lists/${result.value.id}`);
  }

  const toggleIncluded = (entryId) =>
    setExcluded((ids) => (ids.includes(entryId) ? ids.filter((v) => v !== entryId) : [...ids, entryId]));

  const days = plan ? eachDay(plan.startDate, plan.endDate) : [];
  const selectedCount = plan ? plan.entries.filter((entry) => !excluded.includes(entry.id)).length : 0;

  return (
    <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <p className="mb-4">
        <Link to="/meal-plans" className="inline-flex items-center gap-2 text-xs font-semibold text-warm-600 hover:text-warm-900">
          ← Meal planner
        </Link>
      </p>

      {isLoading && <p className="text-sm text-warm-600" role="status">Loading meal plan…</p>}
      {!isLoading && error && (status === 404 || status === 400) && (
        <p className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4" role="alert">
          Meal plan not found.
        </p>
      )}
      {!isLoading && error && status !== 404 && status !== 400 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700">
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

      {plan && (
        <>
          <div className="flex flex-wrap items-baseline gap-3">
            {isRenaming ? (
              <form className="flex flex-wrap items-center gap-3 mt-2" onSubmit={saveName}>
                <input
                  id="plan-name"
                  type="text"
                  value={nameDraft}
                  maxLength={80}
                  required
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="px-3 py-2 rounded-xl border border-warm-200 bg-warm-50/50 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  disabled={busy.includes("rename")}
                  className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold disabled:opacity-60"
                >
                  Save name
                </button>
                <button
                  type="button"
                  className="text-xs text-brand-600 hover:underline"
                  onClick={() => setIsRenaming(false)}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold text-warm-900">{plan.name}</h1>
                <button
                  type="button"
                  className="text-xs text-brand-600 hover:underline"
                  onClick={() => {
                    setNameDraft(plan.name);
                    setIsRenaming(true);
                  }}
                >
                  Rename
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-warm-600 mt-1">{formatRange(plan.startDate, plan.endDate)}</p>

          {actionError && (
            <p className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3" role="alert">
              {actionError}
            </p>
          )}

          <PlanRecipePicker days={days} onAdd={addRecipe} disabled={busy.includes("add")} />

          <ol className="list-none p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {days.map((day) => {
              const entries = plan.entries.filter((entry) => entry.date === day);
              return (
                <li key={day} className="bg-white rounded-2xl border border-warm-200 p-4 shadow-warm-sm">
                  <h3 className="text-sm font-bold text-warm-900 mb-2">{formatDay(day)}</h3>
                  {entries.length === 0 && <p className="text-xs text-warm-600 italic">Nothing planned</p>}
                  {entries.length > 0 && (
                    <ul className="list-none p-0 space-y-3">
                      {entries.map((entry) => (
                        <li key={entry.id} className="flex flex-col gap-2 pt-2 border-t border-warm-100 first:border-0 first:pt-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!excluded.includes(entry.id)}
                              aria-label={`Include ${entry.recipe.title} in shopping list`}
                              onChange={() => toggleIncluded(entry.id)}
                              className="rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                            />
                            <Link
                              to={`/recipes/${entry.recipe.id}`}
                              className="text-sm font-semibold text-warm-900 hover:text-brand-600 truncate"
                            >
                              {entry.recipe.title}
                            </Link>
                          </div>
                          <span className="text-[11px] text-warm-600">
                            {entry.recipe.prepTime + entry.recipe.cookTime} min · serves {entry.recipe.servings}
                          </span>
                          <div className="flex items-center gap-2">
                            <select
                              value={entry.date}
                              disabled={busy.includes(entry.id)}
                              aria-label={`Move ${entry.recipe.title} (${formatDay(entry.date)}) to another day`}
                              onChange={(event) => moveEntry(entry, event.target.value)}
                              className="flex-1 px-2 py-1.5 rounded-lg border border-warm-200 bg-white text-xs"
                            >
                              {days.map((option) => (
                                <option key={option} value={option}>{formatDay(option)}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={busy.includes(entry.id)}
                              aria-label={`Remove ${entry.recipe.title} from ${formatDay(entry.date)}`}
                              onClick={() => removeEntry(entry)}
                              className="text-xs text-brand-600 hover:underline disabled:opacity-60"
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>

          <section className="mt-8 pt-6 border-t border-warm-200" aria-labelledby="plan-shopping-heading">
            <h2 id="plan-shopping-heading" className="text-lg font-bold text-warm-900 mb-2">
              Shopping list
            </h2>
            {plan.entries.length === 0 ? (
              <p className="text-sm text-warm-600">Plan at least one recipe to create a shopping list.</p>
            ) : (
              <>
                <p className="text-sm text-warm-600 mb-3">
                  {selectedCount} of {plan.entries.length} planned recipes selected. Untick a recipe above to leave it out.
                </p>
                <button
                  type="button"
                  onClick={makeShoppingList}
                  disabled={selectedCount === 0 || busy.includes("shop")}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-xs font-bold transition"
                >
                  {busy.includes("shop") ? "Creating…" : "Create shopping list"}
                </button>
              </>
            )}
          </section>

          <button
            type="button"
            onClick={removePlan}
            disabled={busy.includes("delete")}
            className="mt-8 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-60 text-xs font-bold transition"
          >
            {busy.includes("delete") ? "Deleting…" : "Delete meal plan"}
          </button>
        </>
      )}
    </main>
  );
}