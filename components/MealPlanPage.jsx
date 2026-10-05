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

// Keyed by id so another plan always starts with a clean page.
export default function MealPlanPage() {
  const { id } = useParams();
  return <MealPlanView key={id} id={id} />;
}

const byDate = (entries) => [...entries].sort((a, b) => a.date.localeCompare(b.date));

function MealPlanView({ id }) {
  const navigate = useNavigate();
  const { retry } = useAuth();
  const { isLoading, data: plan, error, status, reload, setData } = useResource(`plan-${id}`, () => fetchMealPlan(id));

  const [busy, setBusy] = useState([]); // what is being saved right now
  const [actionError, setActionError] = useState("");
  const [excluded, setExcluded] = useState([]); // entries left out of the shopping list
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Runs one change: tracks "busy", shows errors, sends an expired session to login.
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
      setData((current) => ({ ...current, entries: byDate(current.entries.map((item) => (item.id === entry.id ? result.value : item))) }));
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
    setExcluded((ids) => (ids.includes(entryId) ? ids.filter((value) => value !== entryId) : [...ids, entryId]));

  const days = plan ? eachDay(plan.startDate, plan.endDate) : [];
  const selectedCount = plan ? plan.entries.filter((entry) => !excluded.includes(entry.id)).length : 0;

  return (
    <main className="planner-page">
      <p><Link to="/meal-plans">← Meal planner</Link></p>

      {isLoading && <p className="recipe-status" role="status">Loading meal plan…</p>}
      {!isLoading && error && (status === 404 || status === 400) && (
        <p className="recipe-error" role="alert">Meal plan not found.</p>
      )}
      {!isLoading && error && status !== 404 && status !== 400 && (
        <div className="recipe-error" role="alert">
          <p>{error}</p>
          <button type="button" className="auth-button" onClick={reload}>Try again</button>
        </div>
      )}

      {plan && (
        <>
          <div className="plan-title">
            {isRenaming ? (
              <form className="plan-rename" onSubmit={saveName}>
                <label className="visually-hidden" htmlFor="plan-name">Plan name</label>
                <input id="plan-name" type="text" value={nameDraft} maxLength={80} required
                  onChange={(event) => setNameDraft(event.target.value)} />
                <button type="submit" className="auth-button" disabled={busy.includes("rename")}>Save name</button>
                <button type="button" className="link-button" onClick={() => setIsRenaming(false)}>Cancel</button>
              </form>
            ) : (
              <>
                <h1>{plan.name}</h1>
                <button type="button" className="link-button"
                  onClick={() => { setNameDraft(plan.name); setIsRenaming(true); }}>
                  Rename
                </button>
              </>
            )}
          </div>
          <p className="recipe-card-description">{formatRange(plan.startDate, plan.endDate)}</p>

          {actionError && <p className="recipe-error" role="alert">{actionError}</p>}

          <PlanRecipePicker days={days} onAdd={addRecipe} disabled={busy.includes("add")} />

          <ol className="plan-days">
            {days.map((day) => {
              const entries = plan.entries.filter((entry) => entry.date === day);
              return (
                <li key={day} className="plan-day">
                  <h3>{formatDay(day)}</h3>
                  {entries.length === 0 && <p className="plan-empty">Nothing planned</p>}
                  {entries.length > 0 && (
                    <ul>
                      {entries.map((entry) => (
                        <li key={entry.id} className="plan-entry">
                          <div className="plan-entry-main">
                            <input type="checkbox" checked={!excluded.includes(entry.id)}
                              aria-label={`Include ${entry.recipe.title} in shopping list`}
                              onChange={() => toggleIncluded(entry.id)} />
                            <Link to={`/recipes/${entry.recipe.id}`}>{entry.recipe.title}</Link>
                          </div>
                          <span className="recipe-card-meta">
                            {entry.recipe.prepTime + entry.recipe.cookTime} min · serves {entry.recipe.servings}
                          </span>
                          <div className="plan-entry-actions">
                            <select value={entry.date} disabled={busy.includes(entry.id)}
                              aria-label={`Move ${entry.recipe.title} (${formatDay(entry.date)}) to another day`}
                              onChange={(event) => moveEntry(entry, event.target.value)}>
                              {days.map((option) => (
                                <option key={option} value={option}>{formatDay(option)}</option>
                              ))}
                            </select>
                            <button type="button" className="link-button" disabled={busy.includes(entry.id)}
                              aria-label={`Remove ${entry.recipe.title} from ${formatDay(entry.date)}`}
                              onClick={() => removeEntry(entry)}>
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

          <section className="plan-shopping" aria-labelledby="plan-shopping-heading">
            <h2 id="plan-shopping-heading">Shopping list</h2>
            {plan.entries.length === 0 ? (
              <p className="recipe-status">Plan at least one recipe to create a shopping list.</p>
            ) : (
              <>
                <p>
                  {selectedCount} of {plan.entries.length} planned recipes selected. Untick a recipe above to
                  leave it out.
                </p>
                <button type="button" className="auth-button" onClick={makeShoppingList}
                  disabled={selectedCount === 0 || busy.includes("shop")}>
                  {busy.includes("shop") ? "Creating…" : "Create shopping list"}
                </button>
              </>
            )}
          </section>

          <button type="button" className="delete-button" onClick={removePlan} disabled={busy.includes("delete")}>
            {busy.includes("delete") ? "Deleting…" : "Delete meal plan"}
          </button>
        </>
      )}
    </main>
  );
}
