import { describeError } from "./sanitize.js";

// Why a provider call failed. The manager decides what to do from the category alone.
export const ERROR_CATEGORIES = Object.freeze({
  QUOTA_EXHAUSTED: "quota_exhausted", // HTTP 402, or a 429/403 that says credits/quota are used up
  RATE_LIMITED: "rate_limited", // HTTP 429
  SERVER_ERROR: "server_error", // HTTP 500/502/503/504/529 (includes overloaded providers)
  TIMEOUT: "timeout",
  NETWORK: "network", // connection refused/reset, DNS failure, ...
  AUTH: "auth", // HTTP 401/403: missing, invalid or revoked key
  MODEL_UNAVAILABLE: "model_unavailable", // HTTP 404: model id unknown to the provider
  BAD_REQUEST: "bad_request", // other 4xx: this request was rejected, retrying it will not help
  CONFIGURATION: "configuration", // e.g. the provider's SDK is not installed
  UNKNOWN: "unknown",
});

const C = ERROR_CATEGORIES;

// Configuration problems are logged as such so the operator knows to fix them.
export const CONFIGURATION_CATEGORIES = new Set([C.AUTH, C.CONFIGURATION, C.MODEL_UNAVAILABLE]);

// A failure of the provider call itself (as opposed to the model returning unusable text).
export class ProviderError extends Error {
  constructor({ provider, model, category, status, retryAfterMs, message }) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.model = model;
    this.category = category;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

// Thrown by a task passed to ProviderManager.run() when the provider answered but the answer was
// not a usable recipe even after the task's own retries. The manager falls back to the next provider.
export class InvalidOutputError extends Error {
  constructor(problem) {
    super(problem);
    this.name = "InvalidOutputError";
    this.problem = problem;
  }
}

const NETWORK_CODES = new Set([
  "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EPIPE", "ENETUNREACH", "EHOSTUNREACH",
  "UND_ERR_SOCKET", "UND_ERR_CONNECT", "UND_ERR_CLOSED",
]);
const TIMEOUT_CODES = new Set(["ETIMEDOUT", "ESOCKETTIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"]);

const QUOTA_TEXT = /no remaining credits|insufficient[_ ]quota|exceeded your current quota|quota (?:has been )?exceeded|out of credits|credit balance|payment required|purchase pre-?paid credits|billing/i;
const TEXT_SOURCES = ["message", "code", "type", "status"]; // short fields only; never headers or bodies in full

// SDKs disagree on where the HTTP status lives.
function readStatus(err) {
  const candidates = [err?.status, err?.statusCode, err?.httpResponse?.status, err?.response?.status, err?.cause?.status];
  const status = candidates.find((value) => Number.isInteger(value));
  return status;
}

function readCode(err) {
  const candidates = [err?.code, err?.cause?.code, err?.error?.code, err?.error?.error?.code, err?.error?.status];
  return candidates.find((value) => typeof value === "string");
}

function readHeader(headers, name) {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name) ?? undefined;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? headers[key] : undefined;
}

export function parseRetryAfterMs(err) {
  const headers = err?.headers ?? err?.httpResponse?.headers ?? err?.response?.headers;
  const ms = Number(readHeader(headers, "retry-after-ms"));
  if (Number.isFinite(ms) && ms >= 0) return ms;

  const raw = readHeader(headers, "retry-after");
  if (raw === undefined || raw === null || raw === "") return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(raw);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

function categorize(err, status, code, timedOut) {
  if (timedOut) return C.TIMEOUT;

  const text = TEXT_SOURCES.map((key) => err?.[key]).filter((v) => typeof v === "string").join(" ");
  const nameOrCode = `${err?.name ?? ""} ${code ?? ""}`;

  if (status === 402) return C.QUOTA_EXHAUSTED;
  if ((status === undefined || [429, 403, 400].includes(status)) && QUOTA_TEXT.test(`${text} ${code ?? ""}`)) return C.QUOTA_EXHAUSTED;
  if (status === 429) return C.RATE_LIMITED;
  if (status === 401 || status === 403) return C.AUTH;
  if (status === 404) return C.MODEL_UNAVAILABLE;
  if (status === 408) return C.TIMEOUT;
  if (status >= 500 && status <= 599) return C.SERVER_ERROR;
  if (status >= 400 && status <= 499) return C.BAD_REQUEST;

  // No HTTP status: look at what kind of failure it was.
  if (TIMEOUT_CODES.has(code) || /timeout|timedout|TimeoutError/i.test(nameOrCode)) return C.TIMEOUT;
  if (err?.name === "AbortError") return C.TIMEOUT;
  if (NETWORK_CODES.has(code) || /ConnectionError|FetchError/i.test(err?.name ?? "") || /fetch failed|network|socket hang up/i.test(err?.message ?? "")) {
    return C.NETWORK;
  }
  return C.UNKNOWN;
}

// Turns whatever an SDK threw into a ProviderError with a sanitized message.
// `timedOut` is true when the manager's own timer fired, which is more reliable than guessing from the error.
export function toProviderError(err, { provider, model, timedOut = false, secrets = [] } = {}) {
  if (err instanceof ProviderError) return err;

  const status = readStatus(err);
  const category = categorize(err, status, readCode(err), timedOut);
  return new ProviderError({
    provider,
    model,
    category,
    status,
    retryAfterMs: category === C.RATE_LIMITED ? parseRetryAfterMs(err) : undefined,
    message: describeError(err, secrets),
  });
}
