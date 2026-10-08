import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteShoppingList, fetchShoppingList, setShoppingItemChecked } from "../src/api";
import { useAuth } from "../src/auth/useAuth";
import { useResource } from "../src/useResource";

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
    <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <p className="mb-4">
        <Link to="/shopping-lists" className="inline-flex items-center gap-2 text-xs font-semibold text-warm-600 hover:text-warm-900">
          ← Shopping lists
        </Link>
      </p>

      {isLoading && <p className="text-sm text-warm-600" role="status">Loading shopping list…</p>}
      {!isLoading && error && (status === 404 || status === 400) && (
        <p className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4" role="alert">
          Shopping list not found.
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

      {list && (
        <>
          <h1 className="text-3xl font-extrabold text-warm-900">{list.name}</h1>
          <p className="text-sm text-warm-600 mt-1 mb-4">
            {list.checkedCount} of {list.itemCount} items ticked
            {list.mealPlan && (
              <>
                {" · from "}
                <Link to={`/meal-plans/${list.mealPlan.id}`} className="text-brand-600 font-semibold hover:underline">
                  {list.mealPlan.name}
                </Link>
              </>
            )}
          </p>

          {actionError && (
            <p className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mb-4" role="alert">
              {actionError}
            </p>
          )}

          {list.items.length === 0 ? (
            <p className="text-sm text-warm-600">This list has no items.</p>
          ) : (
            <ul className="list-none p-0 my-4 divide-y divide-warm-100 border border-warm-200 rounded-2xl overflow-hidden bg-white">
              {list.items.map((item) => (
                <li key={item.id}>
                  <label className="flex flex-wrap items-baseline gap-3 px-4 py-3 cursor-pointer hover:bg-warm-50 transition">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      disabled={busyItems.includes(item.id)}
                      onChange={() => toggleItem(item)}
                      className="rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span
                      className={`text-sm font-medium ${
                        item.checked ? "text-warm-600 line-through" : "text-warm-900"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="text-xs text-warm-600 ml-auto">Required: {item.quantity}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-6 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-60 text-xs font-bold transition"
          >
            {isDeleting ? "Deleting…" : "Delete shopping list"}
          </button>
        </>
      )}
    </main>
  );
}