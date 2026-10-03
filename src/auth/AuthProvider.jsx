import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../api.js";

// status: "loading" | "authenticated" | "unauthenticated" | "error"
// "error" means we could not tell (server down, 5xx) - different from a clean 401.
const LOADING = { status: "loading", user: null, error: "" };

async function resolveSession() {
  try {
    const user = await fetchCurrentUser();
    return { status: "authenticated", user, error: "" };
  } catch (err) {
    if (err.status === 401) {
      return { status: "unauthenticated", user: null, error: "" };
    }
    return { status: "error", user: null, error: err.message };
  }
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(LOADING);

  // The server (GET /api/auth/me) is the only source of truth for who is logged in.
  useEffect(() => {
    let ignore = false;
    resolveSession().then((next) => {
      if (!ignore) setSession(next);
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function retry() {
    setSession(LOADING);
    setSession(await resolveSession());
  }

  async function login(email, password) {
    const user = await loginUser(email, password);
    setSession({ status: "authenticated", user, error: "" });
  }

  async function register(name, email, password) {
    const user = await registerUser(name, email, password);
    setSession({ status: "authenticated", user, error: "" });
  }

  async function logout() {
    await logoutUser();
    setSession({ status: "unauthenticated", user: null, error: "" });
  }

  const value = { ...session, login, register, logout, retry };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
