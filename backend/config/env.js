import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

// Vite's default dev server origins. Used only outside production.
const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

// CLIENT_ORIGIN may hold several comma-separated origins.
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // JWT lifetime and cookie lifetime stay in sync

const jwtSecret = process.env.JWT_SECRET || "";
if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to a random string of at least 32 characters in production");
}

const sameSite = (process.env.AUTH_COOKIE_SAMESITE || "lax").toLowerCase();
if (!["lax", "strict", "none"].includes(sameSite)) {
  throw new Error('AUTH_COOKIE_SAMESITE must be "lax", "strict" or "none"');
}

function positiveInteger(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive whole number`);
  }
  return value;
}

// How many reverse proxies sit in front of the API (0 = none). Needed so rate limits see each
// visitor's real IP instead of the proxy's. Only a number is accepted, because "trust everything"
// would let anyone fake their IP.
function parseTrustProxy(raw) {
  if (raw === undefined || raw === "") return false;
  if (!/^\d+$/.test(raw)) throw new Error("TRUST_PROXY must be the number of proxies in front of the API, e.g. 1");
  return Number(raw) === 0 ? false : Number(raw);
}

const MINUTE_MS = 60 * 1000;

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 3001,
  hfAccessToken: process.env.HF_ACCESS_TOKEN || "",
  hfModel: process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret,
  authTokenTtlSeconds: AUTH_TOKEN_TTL_SECONDS,
  // "none" is needed only when the frontend and API are on different sites; browsers require Secure with it.
  authCookieSameSite: sameSite,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  // Per logged-in user, shared by recipe generation and recipe transformation (both call the AI).
  aiRateLimitMax: positiveInteger("AI_RATE_LIMIT_MAX", 20),
  aiRateLimitWindowMs: positiveInteger("AI_RATE_LIMIT_WINDOW_MINUTES", 15) * MINUTE_MS,
  // Per IP address, for failed logins and for sign-ups (counted separately).
  authRateLimitMax: positiveInteger("AUTH_RATE_LIMIT_MAX", 10),
  authRateLimitWindowMs: positiveInteger("AUTH_RATE_LIMIT_WINDOW_MINUTES", 15) * MINUTE_MS,
  clientOrigins:
    configuredOrigins.length > 0
      ? configuredOrigins
      : isProduction
        ? []
        : DEV_ORIGINS,
};
