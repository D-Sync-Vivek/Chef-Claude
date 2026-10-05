import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteShoppingList, fetchShoppingList, setShoppingItemChecked } from "../src/api";
import { useAuth } from "../src/auth/useAuth";
import { useResource } from "../src/useResource";

// Keyed by id so another list always starts with a clean page.
export default function ShoppingListPage() {
  const { id } = useParams();
  return <ShoppingListView key={id} id={id} />;
}

function ShoppingListView({ id }) {
  const navigate = useNavigate();
  const { retry } = useAuth();
  const { isLoading, data: list, error, status, reload, setData } = useResource(`list-${id}`, () => fetchShoppingList(id));
  const [busyItems, setBusyItems] = useState([]);
  const [actionError, setActionError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  function handleFailure(err) {
    if (err.status === 401) retry();
    else setActionError(err.message);
  }

  // The tick is shown after the server has saved it, so the screen never claims more than is stored.
  async function toggleItem(item) {
    if (busyItems.includes(item.id)) return;
    setBusyItems((ids) => [...ids, item.id]);
    setActionError("");
    try {
      const saved = await setShoppingItemChecked(id, item.id, !item.checked);
      setData((current) => {
        const items = current.items.map((entry) => (entry.id === item.id ? saved : entry));
        return { ...current, items, checkedCount: items.filter((entry) => entry.checked).length };
      });
    } catch (err) {
      handleFailure(err);
    } finally {
      setBusyItems((ids) => ids.filter((value) => value !== item.id));
    }
  }

  async function handleDelete() {
    if (isDeleting || !window.confirm("Delete this shopping list? This cannot be undone.")) return;
    setIsDeleting(true);
    setActionError("");
    try {
      await deleteShoppingList(id);
      navigate("/shopping-lists", { replace: true });
    } catch (err) {
      handleFailure(err);
      setIsDeleting(false);
    }
  }

  return (
    <main className="planner-page">
      <p><Link to="/shopping-lists">← Shopping lists</Link></p>

      {isLoading && <p className="recipe-status" role="status">Loading shopping list…</p>}
      {!isLoading && error && (status === 404 || status === 400) && (
        <p className="recipe-error" role="alert">Shopping list not found.</p>
      )}
      {!isLoading && error && status !== 404 && status !== 400 && (
        <div className="recipe-error" role="alert">
          <p>{error}</p>
          <button type="button" className="auth-button" onClick={reload}>Try again</button>
        </div>
      )}

      {list && (
        <>
          <h1>{list.name}</h1>
          <p className="recipe-card-description">
            {list.checkedCount} of {list.itemCount} items ticked
            {list.mealPlan && (
              <> · from <Link to={`/meal-plans/${list.mealPlan.id}`}>{list.mealPlan.name}</Link></>
            )}
          </p>

          {actionError && <p className="recipe-error" role="alert">{actionError}</p>}

          {list.items.length === 0 ? (
            <p className="recipe-status">This list has no items.</p>
          ) : (
            <ul className="shopping-items">
              {list.items.map((item) => (
                <li key={item.id} className={item.checked ? "shopping-item is-checked" : "shopping-item"}>
                  <label>
                    <input type="checkbox" checked={item.checked} disabled={busyItems.includes(item.id)}
                      onChange={() => toggleItem(item)} />
                    <span className="shopping-item-name">{item.name}</span>
                    <span className="shopping-item-qty">Required: {item.quantity}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="delete-button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete shopping list"}
          </button>
        </>
      )}
    </main>
  );
}
