// Everything that can reach a log line from an AI provider goes through here first.
// Provider errors can echo request details (URLs with ?key=..., Authorization headers, tokens),
// so raw error objects are never logged: only the sanitized text built by describeError().

const MAX_LOGGED_TEXT = 300;
const MIN_SECRET_LENGTH = 6; // do not "redact" tiny values such as "1" that would mangle normal text

const PATTERNS = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]"],
  [/\b(authorization|x-api-key|x-goog-api-key|api[_-]?key|access[_-]?token)(["']?\s*[:=]\s*["']?)[^\s"',}&]+/gi, "$1$2[REDACTED]"],
  [/([?&](?:key|api_key|apikey|access_token)=)[^&\s"']+/gi, "$1[REDACTED]"],
  [/\bsk-[A-Za-z0-9_-]{8,}/g, "[REDACTED]"], // OpenAI-style keys, including sk-proj-...
  [/\bgsk_[A-Za-z0-9]{8,}/g, "[REDACTED]"], // Groq keys
  [/\bhf_[A-Za-z0-9]{8,}/g, "[REDACTED]"], // Hugging Face tokens
  [/\bAIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]"], // Google API keys
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// `secrets` are the exact configured credential values, redacted wherever they appear.
export function sanitizeText(input, secrets = []) {
  let text = typeof input === "string" ? input : String(input ?? "");

  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH) {
      text = text.replace(new RegExp(escapeRegExp(secret), "g"), "[REDACTED]");
    }
  }
  for (const [pattern, replacement] of PATTERNS) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/\s+/g, " ").trim();
  return text.length > MAX_LOGGED_TEXT ? `${text.slice(0, MAX_LOGGED_TEXT)}...` : text;
}

// A short, safe description of any thrown value: class name plus sanitized message. Never the stack,
// never request headers, never the original error object.
export function describeError(err, secrets = []) {
  const name = typeof err?.name === "string" && err.name ? err.name : "Error";
  const message = sanitizeText(err?.message ?? err, secrets);
  return message ? `${name}: ${message}` : name;
}
