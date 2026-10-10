import { ApiError } from "../../utils/api-response.js";
import { CONFIGURATION_CATEGORIES, ERROR_CATEGORIES, InvalidOutputError, ProviderError, toProviderError } from "./errors.js";
import { describeError } from "./sanitize.js";

const C = ERROR_CATEGORIES;

export const UNAVAILABLE_MESSAGE = "Recipe generation is temporarily unavailable. Please try again later.";
export const INVALID_OUTPUT_MESSAGE = "The AI couldn't produce a valid recipe this time. Please try again.";

const DEFAULTS = {
  timeoutMs: 30_000, // one provider call
  totalTimeoutMs: 100_000, // everything for one request, across all providers
  maxRetriesPerProvider: 1, // network / 5xx / short rate limit: at most this many repeats per provider
  retryDelayMs: 500,
  maxRateLimitWaitMs: 2_000, // a Retry-After longer than this is not worth waiting for; fall back instead
  minRemainingMs: 1_000, // do not start a call with less budget than this
};

class DeadlineError extends Error {}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// What a provider adapter looks like (see providers/):
//   { name, model, isConfigured(): boolean,
//     generate({ messages, maxTokens, temperature, signal, timeoutMs }) -> { content, finishReason, provider, model } }
// `finishReason` is normalized to "stop", "length" (output cut off) or "other".
export class ProviderManager {
  constructor({
    providers,
    logger = console,
    secrets = [],
    sleep = defaultSleep,
    now = Date.now,
    // Hook for a later cooldown / circuit breaker: return false to skip a provider for now.
    isAvailable = () => true,
    ...limits
  }) {
    this.providers = [...providers];
    this.logger = logger;
    this.secrets = secrets;
    this.sleep = sleep;
    this.now = now;
    this.isAvailable = isAvailable;
    this.limits = { ...DEFAULTS, ...Object.fromEntries(Object.entries(limits).filter(([, v]) => v !== undefined)) };
  }

  // Providers that have credentials and a model configured, in priority order.
  getConfiguredProviders() {
    return this.providers.filter((provider) => provider.isConfigured());
  }

  log(level, message, fields) {
    const line = fields ? `[AI] ${message} ${JSON.stringify(fields)}` : `[AI] ${message}`;
    this.logger[level]?.(line);
  }

  // Simplest use: one request, first provider that answers wins.
  generate(request) {
    return this.run(({ generate }) => generate(request));
  }

  // Runs `task` against each configured provider in order until one succeeds.
  //   task({ provider, generate }) -> result
  // `generate(request)` calls that one provider (timeout, bounded retry, error classification included).
  // The task may throw:
  //   ProviderError      (from generate)  -> provider failed; try the next provider
  //   InvalidOutputError                  -> provider answered with unusable output; try the next provider
  //   anything else (e.g. ApiError 422)   -> stop immediately, nothing is tried on other providers
  async run(task) {
    const candidates = this.#selectProviders();
    if (candidates.length === 0) {
      this.log("error", "No AI provider is configured; set an API key for at least one provider in AI_PROVIDER_ORDER");
      throw new ApiError(500, "Recipe service is not configured");
    }

    const deadline = this.now() + this.limits.totalTimeoutMs;
    const failures = [];

    for (const [index, provider] of candidates.entries()) {
      const position = `${index + 1}/${candidates.length}`;
      if (deadline - this.now() < this.limits.minRemainingMs) {
        this.log("warn", "Overall time budget used up; not trying remaining providers", { remaining: candidates.length - index });
        break;
      }

      this.log("info", `Trying provider ${provider.name}`, { model: provider.model, position });
      const startedAt = this.now();
      const state = { retries: 0 };

      try {
        const result = await task({
          provider: { name: provider.name, model: provider.model },
          generate: (request) => this.#callProvider(provider, request, deadline, state),
        });
        this.log("info", `Provider ${provider.name} succeeded`, { model: provider.model, position, durationMs: this.now() - startedAt });
        return result;
      } catch (err) {
        if (err instanceof DeadlineError) {
          failures.push({ provider: provider.name, category: C.TIMEOUT });
          this.log("warn", "Overall time budget used up", { provider: provider.name });
          break;
        }
        if (err instanceof InvalidOutputError) {
          failures.push({ provider: provider.name, category: "invalid_output" });
          this.log("warn", `Provider ${provider.name} returned unusable output; falling back`, {
            model: provider.model, position, durationMs: this.now() - startedAt, problem: describeError(err.problem, this.secrets),
          });
          continue;
        }
        if (err instanceof ProviderError) {
          failures.push({ provider: provider.name, category: err.category });
          continue; // already logged where it happened
        }
        throw err; // a deliberate answer (such as "not a dish") or a bug: do not hide it behind a fallback
      }
    }

    this.log("error", "All AI providers failed", { failures });
    const producedInvalidOutput = failures.some((failure) => failure.category === "invalid_output");
    throw new ApiError(502, producedInvalidOutput ? INVALID_OUTPUT_MESSAGE : UNAVAILABLE_MESSAGE);
  }

  #selectProviders() {
    const selected = [];
    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        this.log("info", `Skipping provider ${provider.name}: not configured`);
      } else if (!this.isAvailable(provider)) {
        this.log("info", `Skipping provider ${provider.name}: temporarily unavailable`);
      } else {
        selected.push(provider);
      }
    }
    return selected;
  }

  async #callProvider(provider, request, deadline, state) {
    for (let attempt = 1; ; attempt++) {
      const remaining = deadline - this.now();
      if (remaining < this.limits.minRemainingMs) throw new DeadlineError();

      const startedAt = this.now();
      let error;
      try {
        return await this.#callOnce(provider, request, Math.min(this.limits.timeoutMs, remaining));
      } catch (err) {
        error = err instanceof ProviderError ? err : toProviderError(err, { provider: provider.name, model: provider.model, secrets: this.secrets });
      }

      const delay = this.#retryDelay(error, state, deadline);
      this.log(CONFIGURATION_CATEGORIES.has(error.category) ? "error" : "warn",
        `Provider ${provider.name} failed${CONFIGURATION_CATEGORIES.has(error.category) ? " (configuration problem)" : ""}`, {
          model: provider.model, category: error.category, status: error.status, attempt,
          durationMs: this.now() - startedAt, willRetry: delay !== null, error: error.message,
        });

      if (delay === null) throw error;
      state.retries += 1;
      await this.sleep(delay);
    }
  }

  // One attempt with a hard timeout. The abort signal asks the SDK to stop; the race guarantees we
  // stop waiting even if an SDK ignores the signal.
  async #callOnce(provider, request, timeoutMs) {
    const controller = new AbortController();
    let timer;
    let timedOut = false;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new ProviderError({
          provider: provider.name, model: provider.model, category: C.TIMEOUT, message: `no response within ${timeoutMs}ms`,
        }));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        provider.generate({ ...request, signal: controller.signal, timeoutMs }),
        timeout,
      ]);
      return normalizeResult(result, provider);
    } catch (err) {
      if (timedOut) throw err instanceof ProviderError && err.category === C.TIMEOUT ? err : toProviderError(err, { provider: provider.name, model: provider.model, timedOut: true, secrets: this.secrets });
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // null = do not retry. At most `maxRetriesPerProvider` repeats per provider for the whole request,
  // so retries can never loop.
  #retryDelay(error, state, deadline) {
    if (state.retries >= this.limits.maxRetriesPerProvider) return null;

    let delay = null;
    switch (error.category) {
      case C.SERVER_ERROR:
      case C.NETWORK:
        delay = this.limits.retryDelayMs;
        break;
      case C.RATE_LIMITED:
        // Only wait when the provider says the wait is short; otherwise the next provider is faster.
        if (error.retryAfterMs !== undefined && error.retryAfterMs <= this.limits.maxRateLimitWaitMs) delay = error.retryAfterMs;
        break;
      default:
        break; // quota, auth, timeout, bad request, unknown ...: never retried on the same provider
    }

    if (delay !== null && deadline - this.now() < delay + this.limits.minRemainingMs) return null;
    return delay;
  }
}

function normalizeResult(result, provider) {
  const content = typeof result?.content === "string" ? result.content : "";
  const finishReason = result?.finishReason === "length" || result?.finishReason === "stop" ? result.finishReason : "other";
  return { content, finishReason, provider: result?.provider ?? provider.name, model: result?.model ?? provider.model };
}
