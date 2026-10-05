import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth/useAuth";

// Loads data when `key` changes. Pass a new key to load something else.
//   const { isLoading, data, error, status, reload, setData } = useResource("plan-1", () => fetchMealPlan(1));
// - A 401 (expired session) re-checks the session so the route guard can redirect to /login.
// - setData lets a page update what it shows after a successful change, without reloading.
export function useResource(key, load) {
  const { retry } = useAuth();
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const [reloadCount, setReloadCount] = useState(0);
  // `result.key` says which request the data belongs to; while it differs we are loading.
  const requestKey = `${key}#${reloadCount}`;
  const [result, setResult] = useState({ key: null, data: null, error: "", status: null });

  useEffect(() => {
    let ignore = false;
    loadRef.current()
      .then((data) => {
        if (!ignore) setResult({ key: requestKey, data, error: "", status: null });
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) return retry();
        setResult({ key: requestKey, data: null, error: err.message, status: err.status ?? null });
      });
    return () => {
      ignore = true;
    };
  }, [requestKey, retry]);

  const isLoading = result.key !== requestKey;
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const setData = useCallback(
    (update) => setResult((previous) => ({ ...previous, data: typeof update === "function" ? update(previous.data) : update })),
    []
  );

  return {
    isLoading,
    data: isLoading ? null : result.data,
    error: isLoading ? "" : result.error,
    status: isLoading ? null : result.status,
    reload,
    setData,
  };
}
