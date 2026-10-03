import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-response.js";

let prisma;

// One shared client for the whole process (never one per request).
// Created lazily so the API can still start without a database configured.
export function getPrisma() {
  if (!env.databaseUrl) {
    throw new ApiError(503, "Database is not configured");
  }
  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.databaseUrl }),
  });
  return prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
