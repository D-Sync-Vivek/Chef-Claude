export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

export function sendError(res, statusCode, message, details) {
  const error = { message };
  if (details) error.details = details;
  return res.status(statusCode).json({ success: false, error });
}
