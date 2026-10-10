import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InferenceClientProviderApiError } from "@huggingface/inference";
import { ERROR_CATEGORIES as C, toProviderError } from "../services/ai/errors.js";
import { describeError, sanitizeText } from "../services/ai/sanitize.js";

const classify = (err) => toProviderError(err, { provider: "p", model: "m" });

describe("error classification", () => {
  it("recognizes the real Hugging Face 'no remaining credits' error as quota exhausted", () => {
    const err = new InferenceClientProviderApiError(
      "You have no remaining credits. Purchase pre-paid credits to continue using Inference Providers.",
      { url: "https://router.huggingface.co/v1/chat/completions", method: "POST" },
      { requestId: "r1", status: 402, body: {} }
    );
    const result = classify(err);
    assert.equal(result.category, C.QUOTA_EXHAUSTED);
    assert.equal(result.status, 402);
  });

  const cases = [
    ["402 -> quota", { status: 402 }, C.QUOTA_EXHAUSTED],
    ["credits message without a status -> quota", { message: "You have no remaining credits" }, C.QUOTA_EXHAUSTED],
    ["OpenAI insufficient_quota (429) -> quota", { status: 429, code: "insufficient_quota", message: "You exceeded your current quota" }, C.QUOTA_EXHAUSTED],
    ["Gemini RESOURCE_EXHAUSTED quota text (429) -> quota", { status: 429, message: '{"error":{"status":"RESOURCE_EXHAUSTED","message":"You exceeded your current quota"}}' }, C.QUOTA_EXHAUSTED],
    ["plain 429 -> rate limited", { status: 429, message: "Rate limit reached for requests" }, C.RATE_LIMITED],
    ["401 -> auth", { status: 401 }, C.AUTH],
    ["403 -> auth", { status: 403, message: "forbidden" }, C.AUTH],
    ["404 -> model unavailable", { status: 404 }, C.MODEL_UNAVAILABLE],
    ["400 -> bad request", { status: 400, message: "invalid JSON schema" }, C.BAD_REQUEST],
    ["422 -> bad request", { status: 422 }, C.BAD_REQUEST],
    ["500 -> server error", { status: 500 }, C.SERVER_ERROR],
    ["502 -> server error", { status: 502 }, C.SERVER_ERROR],
    ["503 -> server error", { status: 503 }, C.SERVER_ERROR],
    ["504 -> server error", { status: 504 }, C.SERVER_ERROR],
    ["529 overloaded -> server error", { status: 529 }, C.SERVER_ERROR],
    ["status inside httpResponse (Hugging Face shape)", { httpResponse: { status: 503 } }, C.SERVER_ERROR],
    ["ECONNRESET -> network", { code: "ECONNRESET" }, C.NETWORK],
    ["ENOTFOUND -> network", { code: "ENOTFOUND" }, C.NETWORK],
    ["'fetch failed' -> network", { message: "fetch failed" }, C.NETWORK],
    ["ETIMEDOUT -> timeout", { code: "ETIMEDOUT" }, C.TIMEOUT],
    ["SDK timeout error name -> timeout", { name: "APIConnectionTimeoutError", message: "Request timed out." }, C.TIMEOUT],
    ["AbortError -> timeout", { name: "AbortError" }, C.TIMEOUT],
    ["anything else -> unknown", { message: "weird" }, C.UNKNOWN],
  ];
  for (const [label, fields, expected] of cases) {
    it(label, () => {
      assert.equal(classify(Object.assign(new Error(fields.message ?? "x"), fields)).category, expected);
    });
  }

  it("the manager's own timer wins over whatever the SDK threw", () => {
    const result = toProviderError(new Error("aborted"), { provider: "p", model: "m", timedOut: true });
    assert.equal(result.category, C.TIMEOUT);
  });

  it("reads Retry-After from a Headers object (seconds) and from a plain object", () => {
    const a = classify(Object.assign(new Error("x"), { status: 429, headers: new Headers({ "retry-after": "2" }) }));
    const b = classify(Object.assign(new Error("x"), { status: 429, headers: { "Retry-After-Ms": "250" } }));
    assert.equal(a.retryAfterMs, 2000);
    assert.equal(b.retryAfterMs, 250);
  });

  it("never keeps the original error (and so its request headers) on the result", () => {
    const err = Object.assign(new Error("x"), { status: 500, httpRequest: { headers: { Authorization: "Bearer sk-secret-secret-1" } } });
    const result = classify(err);
    assert.equal(result.cause, undefined);
    assert.ok(!JSON.stringify(result).includes("sk-secret"));
  });
});

describe("sanitizing log text", () => {
  const redacted = [
    ["Bearer token", "failed with Authorization: Bearer abc.DEF-123_xyz"],
    ["OpenAI key", "bad key sk-proj-abcdefghijklmnop1234"],
    ["Groq key", "bad key gsk_abcdefghijklmnop1234"],
    ["Hugging Face token", "bad token hf_abcdefghijklmnop1234"],
    ["Google key", "bad key AIzaSyA-abcdefghijklmnopqrstuvwxyz12345"],
    ["key in a URL", "GET https://x.test/v1beta/models/m:generateContent?key=SUPERSECRETVALUE&alt=json"],
    ["x-goog-api-key header", 'headers {"x-goog-api-key": "SUPERSECRETVALUE"}'],
  ];
  for (const [label, input] of redacted) {
    it(`redacts: ${label}`, () => {
      const out = sanitizeText(input);
      assert.match(out, /\[REDACTED\]/);
      assert.doesNotMatch(out, /abc\.DEF|abcdefghijklmnop|SUPERSECRETVALUE|SyA-/);
    });
  }

  it("redacts exact configured secrets that have no recognizable shape", () => {
    assert.equal(sanitizeText("the key my-odd-secret-value was rejected", ["my-odd-secret-value"]), "the key [REDACTED] was rejected");
  });

  it("ignores tiny 'secrets' so normal text is not mangled", () => {
    assert.equal(sanitizeText("status 1 of 2", ["1"]), "status 1 of 2");
  });

  it("truncates long text and collapses whitespace", () => {
    const out = sanitizeText(`a\n\n  b ${"x".repeat(1000)}`);
    assert.ok(out.length <= 303);
    assert.ok(out.startsWith("a b "));
  });

  it("describeError gives name and sanitized message, never a stack", () => {
    const out = describeError(Object.assign(new Error("bad Bearer abc123456789"), { name: "ApiError" }));
    assert.equal(out, "ApiError: bad Bearer [REDACTED]");
  });
});
