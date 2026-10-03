import app from "./app.js";
import { env } from "./config/env.js";
import { disconnectPrisma } from "./db/prisma.js";

if (!env.hfAccessToken) {
  console.warn("HF_ACCESS_TOKEN is not set. POST /api/recipe will fail until it is configured.");
}

if (!env.databaseUrl) {
  console.warn("DATABASE_URL is not set. GET /api/health/db will report the database as not configured.");
}

const server = app.listen(env.port, () => {
  console.log(`Chef Claude API running on port ${env.port} (${env.nodeEnv})`);
  console.log(`Allowed origins: ${env.clientOrigins.join(", ") || "none"}`);
});

async function shutdown() {
  server.close();
  await disconnectPrisma();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
