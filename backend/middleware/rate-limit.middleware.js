import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { sendError } from "../utils/api-response.js";

// Counters live in this process's memory: they reset when the server restarts and are not shared
// between several server instances. Running more than one instance needs a shared store (e.g. Redis).

function createLimiter({ windowMs, max, message, keyGenerator, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-7", // RateLimit-* headers, and Retry-After once the limit is hit
    legacyHeaders: false,
    skipSuccessfulRequests,
    ...(keyGenerator ? { keyGenerator } : {}), // default key: the client's IP address
    // Same JSON error shape as every other API error.
    handler: (req, res) => {
      const retryAfterSeconds = Math.max(1, Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000));
      console.warn(`[rate-limit] 429 ${req.method} ${req.originalUrl} (retry in ${retryAfterSeconds}s)`);
      return sendError(res, 429, message, { retryAfterSeconds });
    },
  });
}

// Recipe generation and transformation cost AI calls, so they are limited per logged-in user.
// Use after requireAuth. Requests rejected for invalid input count too, so hammering is not free.
export const aiLimiter = createLimiter({
  windowMs: env.aiRateLimitWindowMs,
  max: env.aiRateLimitMax,
  keyGenerator: (req) => `user:${req.user.id}`,
  message: "You're asking for recipes too quickly. Please wait a few minutes and try again.",
});

// Only failed logins count, so a normal user is never affected; a correct password is still
// refused while an IP is locked out.
export const loginLimiter = createLimiter({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please wait a few minutes and try again.",
});

export const registerLimiter = createLimiter({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  message: "Too many sign-up attempts. Please wait a few minutes and try again.",
});
