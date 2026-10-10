import { ProviderManager } from "../services/ai/provider-manager.js";

export const RECIPE = {
  title: "Chicken Biryani",
  description: "Fragrant layered rice with spiced chicken.",
  prepTime: 30,
  cookTime: 45,
  servings: 4,
  difficulty: "medium",
  ingredients: [
    { name: "basmati rice", quantity: "2", unit: "cups" },
    { name: "chicken", quantity: 500, unit: "g" }, // a number on purpose: the schema normalizes it to text
  ],
  instructions: ["Marinate the chicken.", "Parboil the rice.", "Layer and steam for 20 minutes."],
};
export const RECIPE_JSON = JSON.stringify(RECIPE);

export const ok = (content = RECIPE_JSON, finishReason = "stop") => ({ content, finishReason });

// An error shaped like what the SDKs throw: a message and an HTTP status.
export function httpError(status, message = `HTTP ${status}`, extra = {}) {
  return Object.assign(new Error(message), { status }, extra);
}

// A fake provider. `steps` is what each call does, in order (the last step repeats):
// a result object, an Error to throw, or a function (request) => result | Promise.
export function makeProvider(name, steps, { configured = true } = {}) {
  const calls = [];
  return {
    name,
    model: `${name}-model`,
    calls,
    isConfigured: () => configured,
    async generate(request) {
      calls.push(request);
      const step = steps[Math.min(calls.length - 1, steps.length - 1)];
      if (typeof step === "function") return step(request);
      if (step instanceof Error) throw step;
      return step;
    },
  };
}

export function captureLogger() {
  const lines = [];
  const logger = {};
  for (const level of ["info", "warn", "error"]) logger[level] = (line) => lines.push(`${level}: ${line}`);
  return { logger, lines, text: () => lines.join("\n") };
}

export function makeManager(providers, options = {}) {
  const log = captureLogger();
  const sleeps = [];
  const manager = new ProviderManager({
    providers,
    logger: log.logger,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    ...options,
  });
  return { manager, log, sleeps };
}

export const REQUEST = { messages: [{ role: "user", content: "hi" }], maxTokens: 100, temperature: 0.4 };
