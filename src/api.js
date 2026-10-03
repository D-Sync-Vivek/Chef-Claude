const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FALLBACK_MESSAGES = {
  400: "Please check your ingredients and try again.",
  500: "Something went wrong on the server. Please try again later.",
};

export async function fetchRecipe(ingredients) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }

  // The body may not be JSON (e.g. a proxy error page), so parse defensively.
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.error?.message ||
      FALLBACK_MESSAGES[res.status] ||
      (res.status >= 500 ? FALLBACK_MESSAGES[500] : "Request failed.");
    throw new Error(message);
  }

  if (typeof data?.recipe !== "string") {
    throw new Error("The server returned an unexpected response.");
  }

  return data;
}
