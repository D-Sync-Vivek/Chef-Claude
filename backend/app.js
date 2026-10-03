import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { databaseHealth } from "./controllers/health.controller.js";
import recipeRoutes from "./routes/recipe.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { sendSuccess } from "./utils/api-response.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, server-to-server) are not browser CORS requests.
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      const err = new Error("Origin not allowed");
      err.code = "CORS_NOT_ALLOWED";
      return callback(err);
    },
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) =>
  sendSuccess(res, { message: "Chef Claude API is running" })
);
app.get("/api/health/db", databaseHealth);
app.use("/api/recipe", recipeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
