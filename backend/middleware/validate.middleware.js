import { ApiError } from "../utils/api-response.js";

function runSchema(schema, input) {
  const result = schema.safeParse(input ?? {});
  if (result.success) return result.data;

  const details = result.error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
  throw new ApiError(400, details[0].message, details);
}

// Validates req.body and replaces it with the cleaned data.
export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.body = runSchema(schema, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Validated params/query are stored on req.validated (req.query is read-only in Express 5).
export function validateParams(schema) {
  return (req, _res, next) => {
    try {
      req.validated = { ...req.validated, params: runSchema(schema, req.params) };
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    try {
      req.validated = { ...req.validated, query: runSchema(schema, req.query) };
      next();
    } catch (err) {
      next(err);
    }
  };
}
