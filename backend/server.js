import app from "./app.js";
import { env } from "./config/env.js";
import { disconnectPrisma } from "./db/prisma.js";
import { describeAiProviders } from "./services/ai/index.js";

const aiProviders = describeAiProviders();
if (aiProviders.configured.length === 0) {
  console.warn("No AI provider is configured (set GEMINI_API_KEY, GROQ_API_KEY, HF_ACCESS_TOKEN or OPENAI_API_KEY). Recipe generation will fail until one is.");
} else {
  console.log(`AI providers in priority order: ${aiProviders.configured.join(" -> ")}`);
  if (aiProviders.skipped.length > 0) console.log(`AI providers skipped (no API key): ${aiProviders.skipped.join(", ")}`);
}

if (env.jwtSecret.length < 32) {
  console.warn("JWT_SECRET is not set or shorter than 32 characters. Auth endpoints will fail until it is configured.");
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
