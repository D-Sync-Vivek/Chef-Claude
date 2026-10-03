const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FALLBACK_MESSAGES = {
  400: "Please check your input and try again.",
  401: "Please log in to continue.",
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

export async function fetchRecipe(ingredients) {
  const data = await request("/api/recipe", { method: "POST", body: { ingredients } });

  if (typeof data?.recipe !== "string") {
    throw new Error("The server returned an unexpected response.");
  }

  return data;
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
