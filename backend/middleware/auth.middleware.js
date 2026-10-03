import { getAuthenticatedUser } from "../services/auth.service.js";
import { ApiError } from "../utils/api-response.js";
import { AUTH_COOKIE_NAME, clearAuthCookie } from "../utils/auth-cookie.js";

// Protects a route. On success, req.user is the authenticated user loaded from the database.
// Always use req.user.id, never an id sent by the client.
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const user = await getAuthenticatedUser(token);
    if (!user) {
      clearAuthCookie(res); // drop the unusable cookie so the browser stops sending it
      throw new ApiError(401, "Your session is invalid or has expired. Please log in again.");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
