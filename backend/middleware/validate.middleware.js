import { ApiError } from "../utils/api-response.js";

// Validates req.body against a Zod schema and replaces it with the cleaned data.
export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));
      return next(new ApiError(400, details[0].message, details));
    }

    req.body = result.data;
    next();
  };
}
