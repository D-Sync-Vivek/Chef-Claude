import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createMealPlan, fetchMealPlans } from "../src/api";
import { useAuth } from "../src/auth/useAuth";
import { addDays, formatRange, todayIso } from "../src/dateUtils";
import { useResource } from "../src/useResource";

const MAX_DAYS = 31;

export default function MealPlansPage() {
  const navigate = useNavigate();
  const { retry } = useAuth();
  const { isLoading, data: plans, error, reload } = useResource("meal-plans", fetchMealPlans);

  const [form, setForm] = useState({ name: "Weekly plan", startDate: todayIso(), days: "7" });
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleCreate(event) {
    event.preventDefault();
    if (isCreating) return;
    const days = Number(form.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
      setFormError(`Choose between 1 and ${MAX_DAYS} days.`);
      return;
    }

    setIsCreating(true);
    setFormError("");
    try {
      const plan = await createMealPlan({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: addDays(form.startDate, days - 1),
      });
      navigate(`/meal-plans/${plan.id}`);
    } catch (err) {
      if (err.status === 401) retry();
      else setFormError(err.message);
      setIsCreating(false);
    }
  }

  return (
    <main className="planner-page">
      <h1>Meal planner</h1>

      <form className="plan-form" onSubmit={handleCreate}>
        <h2>New meal plan</h2>
        <div className="plan-form-fields">
          <label>
            Plan name
            <input type="text" value={form.name} onChange={update("name")} maxLength={80} required />
          </label>
          <label>
            Start date
            <input type="date" value={form.startDate} onChange={update("startDate")} required />
          </label>
          <label>
            Number of days
            <input type="number" min="1" max={MAX_DAYS} step="1" value={form.days} onChange={update("days")} required />
          </label>
        </div>
        {formError && <p className="recipe-error" role="alert">{formError}</p>}
        <button type="submit" className="auth-button" disabled={isCreating}>
          {isCreating ? "Creating…" : "Create plan"}
        </button>
      </form>

      <h2>Your plans</h2>
      {isLoading && <p className="recipe-status" role="status">Loading your meal plans…</p>}

      {!isLoading && error && (
        <div className="recipe-error" role="alert">
          <p>{error}</p>
          <button type="button" className="auth-button" onClick={reload}>Try again</button>
        </div>
      )}

      {!isLoading && plans && plans.length === 0 && (
        <p className="recipe-status">No meal plans yet. Create your first plan above.</p>
      )}

      {!isLoading && plans && plans.length > 0 && (
        <ul className="plan-list">
          {plans.map((plan) => (
            <li key={plan.id} className="recipe-card">
              <Link to={`/meal-plans/${plan.id}`} className="recipe-card-title">{plan.name}</Link>
              <p className="recipe-card-description">{formatRange(plan.startDate, plan.endDate)}</p>
              <span className="recipe-card-meta">
                {plan.entryCount === 1 ? "1 recipe planned" : `${plan.entryCount} recipes planned`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
