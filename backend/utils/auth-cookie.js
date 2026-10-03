import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "chef_token";

// set and clear must use identical attributes, otherwise browsers will not remove the cookie.
function baseOptions() {
  return {
    httpOnly: true, // not readable from JavaScript, so XSS cannot steal the token
    secure: env.isProduction || env.authCookieSameSite === "none",
    sameSite: env.authCookieSameSite,
    path: "/",
  };
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseOptions(),
    maxAge: env.authTokenTtlSeconds * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, baseOptions());
}
