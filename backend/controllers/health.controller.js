import { checkDatabaseConnection } from "../services/database.service.js";
import { sendSuccess } from "../utils/api-response.js";

export async function databaseHealth(_req, res, next) {
  try {
    await checkDatabaseConnection();
    return sendSuccess(res, { message: "Database connection is healthy" });
  } catch (err) {
    next(err);
  }
}
