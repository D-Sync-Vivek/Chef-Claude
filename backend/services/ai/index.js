import { env } from "../../config/env.js";
import { ProviderManager } from "./provider-manager.js";
import { buildProviders } from "./providers/index.js";

let manager;

// One shared manager for the whole app, built from the environment on first use.
export function getProviderManager() {
  manager ??= new ProviderManager({
    providers: buildProviders(env.aiProviderOrder, env),
    secrets: [env.geminiApiKey, env.groqApiKey, env.hfAccessToken, env.openaiApiKey],
    timeoutMs: env.aiProviderTimeoutMs,
    totalTimeoutMs: env.aiTotalTimeoutMs,
  });
  return manager;
}

// For the startup log: which providers will be used, in order, and which were skipped.
export function describeAiProviders() {
  const providers = getProviderManager().providers;
  return {
    configured: providers.filter((p) => p.isConfigured()).map((p) => `${p.name} (${p.model})`),
    skipped: providers.filter((p) => !p.isConfigured()).map((p) => p.name),
  };
}
