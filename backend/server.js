import app from "./app.js";
import { env } from "./config/env.js";

if (!env.hfAccessToken) {
  console.warn("HF_ACCESS_TOKEN is not set. POST /api/recipe will fail until it is configured.");
}

app.listen(env.port, () => {
  console.log(`Chef Claude API running on port ${env.port} (${env.nodeEnv})`);
  console.log(`Allowed origins: ${env.clientOrigins.join(", ") || "none"}`);
});
