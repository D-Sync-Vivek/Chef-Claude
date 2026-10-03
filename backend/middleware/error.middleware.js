import { ApiError, sendError } from "../utils/api-response.js";

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
}

// Express recognizes error handlers by their 4-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let statusCode = 500;
  let message = "Internal server error";
  let details;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body is not valid JSON";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  } else if (err.code === "CORS_NOT_ALLOWED") {
    statusCode = 403;
    message = "Origin not allowed";
  }

  // Always log server-side; 4xx are client mistakes so log them briefly.
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  } else {
    console.warn(`[${req.method} ${req.originalUrl}] ${statusCode} ${message}`);
  }

  // Never leak internal error messages or stacks for server errors.
  if (statusCode >= 500 && !(err instanceof ApiError)) {
    message = "Internal server error";
  }

  return sendError(res, statusCode, message, details);
}
