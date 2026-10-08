import { Link } from "react-router-dom";
import { fetchShoppingLists } from "../src/api";
import { formatDate } from "../src/recipeFormat";
import { useResource } from "../src/useResource";

export default function ShoppingListsPage() {
  const { isLoading, data: lists, error, reload } = useResource("shopping-lists", fetchShoppingLists);

  return (
    <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-warm-900 mb-4">Shopping Lists</h1>

      {isLoading && <p className="text-sm text-warm-600" role="status">Loading your shopping lists…</p>}

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

      {!isLoading && lists && lists.length === 0 && (
        <p className="text-sm text-warm-600">
          No shopping lists yet. Open a{" "}
          <Link to="/meal-plans" className="text-brand-600 font-semibold hover:underline">meal plan</Link>{" "}
          and choose &quot;Create shopping list&quot;.
        </p>
      )}

      {!isLoading && lists && lists.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
          {lists.map((list) => (
            <li key={list.id} className="bg-white rounded-2xl border border-warm-200 p-5 shadow-warm-sm">
              <Link
                to={`/shopping-lists/${list.id}`}
                className="text-base font-bold text-warm-900 hover:text-brand-600 transition"
              >
                {list.name}
              </Link>
              <p className="text-xs text-warm-600 mt-1">
                {list.checkedCount} of {list.itemCount} items ticked
                {list.mealPlan ? ` · from ${list.mealPlan.name}` : ""}
              </p>
              <span className="text-[11px] text-warm-600 mt-2 inline-block">
                Created <time dateTime={list.createdAt}>{formatDate(list.createdAt)}</time>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}