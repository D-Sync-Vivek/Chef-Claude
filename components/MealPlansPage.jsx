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

  const fieldClass =
    "w-full px-3 py-2.5 rounded-xl border border-warm-200 bg-warm-50/50 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition";

  return (
    <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-warm-900">Meal Planner</h1>

      <form
        onSubmit={handleCreate}
        className="mt-6 p-6 rounded-2xl border border-warm-200 bg-white shadow-warm-sm"
      >
        <h2 className="text-lg font-bold text-warm-900 mb-4">New meal plan</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex-1 min-w-[180px] flex flex-col gap-1">
            <span className="text-xs font-semibold text-warm-700">Plan name</span>
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              maxLength={80}
              required
              className={fieldClass}
            />
          </label>
          <label className="flex-1 min-w-[180px] flex flex-col gap-1">
            <span className="text-xs font-semibold text-warm-700">Start date</span>
            <input type="date" value={form.startDate} onChange={update("startDate")} required className={fieldClass} />
          </label>
          <label className="flex-1 min-w-[140px] flex flex-col gap-1">
            <span className="text-xs font-semibold text-warm-700">Number of days</span>
            <input
              type="number"
              min="1"
              max={MAX_DAYS}
              step="1"
              value={form.days}
              onChange={update("days")}
              required
              className={fieldClass}
            />
          </label>
        </div>
        {formError && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl mb-3" role="alert">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={isCreating}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-xs font-bold transition"
        >
          {isCreating ? "Creating…" : "Create plan"}
        </button>
      </form>

      <h2 className="text-lg font-bold text-warm-900 mt-8 mb-3">Your plans</h2>

      {isLoading && (
        <p className="text-sm text-warm-600" role="status">Loading your meal plans…</p>
      )}

      {!isLoading && error && (
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

      {!isLoading && plans && plans.length === 0 && (
        <p className="text-sm text-warm-600">No meal plans yet. Create your first plan above.</p>
      )}

      {!isLoading && plans && plans.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
          {plans.map((plan) => (
            <li key={plan.id} className="bg-white rounded-2xl border border-warm-200 p-5 shadow-warm-sm">
              <Link
                to={`/meal-plans/${plan.id}`}
                className="text-base font-bold text-warm-900 hover:text-brand-600 transition"
              >
                {plan.name}
              </Link>
              <p className="text-xs text-warm-600 mt-1">{formatRange(plan.startDate, plan.endDate)}</p>
              <span className="text-[11px] text-warm-600 mt-2 inline-block">
                {plan.entryCount === 1 ? "1 recipe planned" : `${plan.entryCount} recipes planned`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}