const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FALLBACK_MESSAGES = {
  400: "Please check your input and try again.",
  401: "Please log in to continue.",
  404: "That was not found.",
  500: "Something went wrong on the server. Please try again later.",
};

export class ApiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status; // 0 means the server could not be reached
  }
}

// Shared by every API call. credentials: "include" sends and receives the
// HTTP-only auth cookie, so no token is ever handled by JavaScript.
async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError("Cannot reach the server. Check your connection and try again.", 0);
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
    throw new ApiRequestError(message, res.status);
  }

  return data;
}

function extractRecipe(data) {
  if (!data?.recipe?.id || !Array.isArray(data.recipe.ingredients)) {
    throw new Error("The server returned an unexpected response.");
  }
  return data.recipe;
}

// payload: { ingredients, servings?, difficulty?, maxCookingTime? }. The server decides who owns the recipe.
export async function generateRecipe(payload) {
  return extractRecipe(await request("/api/recipes/generate", { method: "POST", body: payload }));
}

// params: { cursor?, q?, difficulty? } - empty values are left out of the URL.
function listQuery({ cursor, q, difficulty } = {}) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (q) params.set("q", q);
  if (difficulty) params.set("difficulty", difficulty);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function extractList(data) {
  if (!Array.isArray(data?.recipes)) {
    throw new Error("The server returned an unexpected response.");
  }
  return { recipes: data.recipes, nextCursor: data.nextCursor ?? null };
}

export async function fetchRecipes(params) {
  return extractList(await request(`/api/recipes${listQuery(params)}`));
}

export async function fetchFavorites(params) {
  return extractList(await request(`/api/recipes/favorites${listQuery(params)}`));
}

export async function favoriteRecipe(id) {
  await request(`/api/recipes/${encodeURIComponent(id)}/favorite`, { method: "POST" });
}

export async function unfavoriteRecipe(id) {
  await request(`/api/recipes/${encodeURIComponent(id)}/favorite`, { method: "DELETE" });
}

export async function fetchRecipeById(id) {
  return extractRecipe(await request(`/api/recipes/${encodeURIComponent(id)}`));
}

export async function deleteRecipe(id) {
  await request(`/api/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

function extractUser(data) {
  if (!data?.user?.id) {
    throw new Error("The server returned an unexpected response.");
  }
  return data.user;
}

export async function fetchCurrentUser() {
  return extractUser(await request("/api/auth/me"));
}

export async function loginUser(email, password) {
  return extractUser(await request("/api/auth/login", { method: "POST", body: { email, password } }));
}

export async function registerUser(name, email, password) {
  return extractUser(
    await request("/api/auth/register", { method: "POST", body: { name, email, password } })
  );
}

export async function logoutUser() {
  await request("/api/auth/logout", { method: "POST" });
}
