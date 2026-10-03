import { getPrisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-response.js";

// Resolves if the database answers a trivial query; throws a safe ApiError otherwise.
export async function checkDatabaseConnection() {
  const prisma = getPrisma();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    // The raw error can contain connection details, so it is only logged here.
    console.error("Database connectivity check failed:", err.message);
    throw new ApiError(503, "Database is unavailable");
  }
}
