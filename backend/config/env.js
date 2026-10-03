import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

// Vite's default dev server origins. Used only outside production.
const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

// CLIENT_ORIGIN may hold several comma-separated origins.
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 3001,
  hfAccessToken: process.env.HF_ACCESS_TOKEN || "",
  hfModel: process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct",
  databaseUrl: process.env.DATABASE_URL || "",
  clientOrigins:
    configuredOrigins.length > 0
      ? configuredOrigins
      : isProduction
        ? []
        : DEV_ORIGINS,
};
