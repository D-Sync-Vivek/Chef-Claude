import { createGeminiProvider } from "./gemini.js";
import { createGroqProvider } from "./groq.js";
import { createHuggingFaceProvider } from "./huggingface.js";
import { createOpenAIProvider } from "./openai.js";

// To add a provider: write providers/<name>.js exporting a factory, register it here, add its
// env variables to config/env.js and .env.example. Nothing else changes.
// Each entry maps a name usable in AI_PROVIDER_ORDER to a factory that reads its settings from `config`.
export const PROVIDER_REGISTRY = {
  gemini: (config) => createGeminiProvider({ apiKey: config.geminiApiKey, model: config.geminiModel }),
  groq: (config) => createGroqProvider({ apiKey: config.groqApiKey, model: config.groqModel }),
  huggingface: (config) => createHuggingFaceProvider({ apiKey: config.hfAccessToken, model: config.hfModel }),
  openai: (config) =>
    createOpenAIProvider({ apiKey: config.openaiApiKey, model: config.openaiModel, reasoningEffort: config.openaiReasoningEffort }),
};

const ALIASES = { hf: "huggingface", google: "gemini" };

// Builds the providers named in `order`, in that order. Unknown names are reported and skipped,
// repeated names are used once. A provider without credentials is still returned: the manager
// skips it (and logs why) instead of this function crashing.
export function buildProviders(order, config, { registry = PROVIDER_REGISTRY, logger = console } = {}) {
  const providers = [];
  const seen = new Set();

  for (const rawName of order) {
    const name = ALIASES[rawName] ?? rawName;
    if (seen.has(name)) continue;
    seen.add(name);

    const factory = registry[name];
    if (!factory) {
      logger.warn?.(`[AI] Unknown provider "${rawName}" in AI_PROVIDER_ORDER was ignored (known: ${Object.keys(registry).join(", ")})`);
      continue;
    }
    providers.push(factory(config));
  }
  return providers;
}
