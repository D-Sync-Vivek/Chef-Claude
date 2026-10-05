import { Link } from "react-router-dom";
import { fetchShoppingLists } from "../src/api";
import { formatDate } from "../src/recipeFormat";
import { useResource } from "../src/useResource";

export default function ShoppingListsPage() {
  const { isLoading, data: lists, error, reload } = useResource("shopping-lists", fetchShoppingLists);

  return (
    <main className="planner-page">
      <h1>Shopping lists</h1>

      {isLoading && <p className="recipe-status" role="status">Loading your shopping lists…</p>}

      {!isLoading && error && (
        <div className="recipe-error" role="alert">
          <p>{error}</p>
          <button type="button" className="auth-button" onClick={reload}>Try again</button>
        </div>
      )}

      {!isLoading && lists && lists.length === 0 && (
        <p className="recipe-status">
          No shopping lists yet. Open a <Link to="/meal-plans">meal plan</Link> and choose &quot;Create shopping list&quot;.
        </p>
      )}

      {!isLoading && lists && lists.length > 0 && (
        <ul className="plan-list">
          {lists.map((list) => (
            <li key={list.id} className="recipe-card">
              <Link to={`/shopping-lists/${list.id}`} className="recipe-card-title">{list.name}</Link>
              <p className="recipe-card-description">
                {list.checkedCount} of {list.itemCount} items ticked
                {list.mealPlan ? ` · from ${list.mealPlan.name}` : ""}
              </p>
              <span className="recipe-card-meta">
                Created <time dateTime={list.createdAt}>{formatDate(list.createdAt)}</time>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
