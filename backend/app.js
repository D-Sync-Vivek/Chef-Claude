import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { databaseHealth } from "./controllers/health.controller.js";
import authRoutes from "./routes/auth.routes.js";
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
    credentials: true, // lets the browser send/receive the auth cookie from the allowed origins
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) =>
  sendSuccess(res, { message: "Chef Claude API is running" })
);
app.get("/api/health/db", databaseHealth);
app.use("/api/auth", authRoutes);
app.use("/api/recipe", recipeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
