import { authenticateUser, registerUser, signAuthToken } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { clearAuthCookie, setAuthCookie } from "../utils/auth-cookie.js";

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);
    setAuthCookie(res, signAuthToken(user.id));
    return sendSuccess(res, { user }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const user = await authenticateUser(req.body);
    setAuthCookie(res, signAuthToken(user.id));
    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

// Idempotent: always succeeds, even without a valid session.
export function logout(_req, res) {
  clearAuthCookie(res);
  return sendSuccess(res, { message: "Logged out" });
}

export function me(req, res) {
  return sendSuccess(res, { user: req.user });
}
