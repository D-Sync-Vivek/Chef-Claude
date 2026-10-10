import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ERROR_CATEGORIES, InvalidOutputError } from "../services/ai/errors.js";
import { INVALID_OUTPUT_MESSAGE, UNAVAILABLE_MESSAGE } from "../services/ai/provider-manager.js";
import { ApiError } from "../utils/api-response.js";
import { REQUEST, httpError, makeManager, makeProvider, ok } from "./helpers.js";

const never = () => new Promise(() => {}); // a provider that hangs forever

describe("provider manager: fallback", () => {
  it("1. primary succeeds: the next provider is never called", async () => {
    const a = makeProvider("a", [ok("A")]);
    const b = makeProvider("b", [ok("B")]);
    const { manager } = makeManager([a, b]);

    const result = await manager.generate(REQUEST);

    assert.deepEqual(result, { content: "A", finishReason: "stop", provider: "a", model: "a-model" });
    assert.equal(a.calls.length, 1);
    assert.equal(b.calls.length, 0);
  });

  it("2. quota exhausted (402): moves on without retrying the same provider", async () => {
    const a = makeProvider("a", [httpError(402, "You have no remaining credits.")]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, sleeps } = makeManager([a, b]);

    const result = await manager.generate(REQUEST);

    assert.equal(result.provider, "b");
    assert.equal(a.calls.length, 1);
    assert.deepEqual(sleeps, []);
  });

  it("3a. rate limited (429) without a retry hint: falls back immediately", async () => {
    const a = makeProvider("a", [httpError(429, "Too many requests")]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, sleeps } = makeManager([a, b]);

    assert.equal((await manager.generate(REQUEST)).provider, "b");
    assert.equal(a.calls.length, 1);
    assert.deepEqual(sleeps, []);
  });

  it("3b. rate limited with a short Retry-After: retries once on the same provider", async () => {
    const a = makeProvider("a", [httpError(429, "slow down", { headers: { "retry-after": "1" } }), ok("A")]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, sleeps } = makeManager([a, b]);

    assert.equal((await manager.generate(REQUEST)).provider, "a");
    assert.equal(a.calls.length, 2);
    assert.equal(b.calls.length, 0);
    assert.deepEqual(sleeps, [1000]);
  });

  it("3c. rate limited with a long Retry-After: does not wait, falls back", async () => {
    const a = makeProvider("a", [httpError(429, "slow down", { headers: { "retry-after": "60" } })]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, sleeps } = makeManager([a, b]);

    assert.equal((await manager.generate(REQUEST)).provider, "b");
    assert.equal(a.calls.length, 1);
    assert.deepEqual(sleeps, []);
  });

  it("4. timeout: a hanging provider is abandoned and the next one answers (no retry on timeout)", async () => {
    let seenSignal;
    const a = makeProvider("a", [
      (request) => {
        seenSignal = request.signal;
        return never();
      },
    ]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, log } = makeManager([a, b], { timeoutMs: 30 });

    const result = await manager.generate(REQUEST);

    assert.equal(result.provider, "b");
    assert.equal(a.calls.length, 1);
    assert.equal(seenSignal.aborted, true, "the SDK is told to stop via the abort signal");
    assert.match(log.text(), /"category":"timeout"/);
  });

  it("5. several providers fail: the first one that works answers", async () => {
    const a = makeProvider("a", [httpError(402)]);
    const b = makeProvider("b", [httpError(429)]);
    const c = makeProvider("c", [ok("C")]);
    const { manager } = makeManager([a, b, c]);

    assert.equal((await manager.generate(REQUEST)).provider, "c");
    assert.deepEqual([a.calls.length, b.calls.length, c.calls.length], [1, 1, 1]);
  });

  it("6. all providers fail: HTTP 502 with a clean message that hides provider details", async () => {
    const a = makeProvider("a", [httpError(402, "You have no remaining credits. Purchase pre-paid credits")]);
    const b = makeProvider("b", [httpError(429, "Rate limit reached for gemini-secret-model")]);
    const c = makeProvider("c", [Object.assign(new Error("connect failed"), { code: "ECONNREFUSED" })]);
    const { manager } = makeManager([a, b, c]);

    await assert.rejects(manager.generate(REQUEST), (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 502);
      assert.equal(err.message, UNAVAILABLE_MESSAGE);
      assert.doesNotMatch(err.message, /credits|gemini|Rate limit/i);
      return true;
    });
  });

  it("7a. missing API key: the provider is skipped cleanly and the next one answers", async () => {
    const a = makeProvider("a", [ok("A")], { configured: false });
    const b = makeProvider("b", [ok("B")]);
    const { manager, log } = makeManager([a, b]);

    assert.equal((await manager.generate(REQUEST)).provider, "b");
    assert.equal(a.calls.length, 0);
    assert.match(log.text(), /Skipping provider a: not configured/);
  });

  it("7b. no provider configured at all: a configuration error (500), not a crash", async () => {
    const { manager } = makeManager([makeProvider("a", [ok()], { configured: false })]);

    await assert.rejects(manager.generate(REQUEST), (err) => err instanceof ApiError && err.statusCode === 500);
  });

  it("skips providers the isAvailable hook rejects (hook for a future cooldown)", async () => {
    const a = makeProvider("a", [ok("A")]);
    const b = makeProvider("b", [ok("B")]);
    const { manager } = makeManager([a, b], { isAvailable: (provider) => provider.name !== "a" });

    assert.equal((await manager.generate(REQUEST)).provider, "b");
    assert.equal(a.calls.length, 0);
  });
});

describe("provider manager: retry policy", () => {
  it("server error (503): retried once, then the same provider can succeed", async () => {
    const a = makeProvider("a", [httpError(503), ok("A")]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, sleeps } = makeManager([a, b]);

    assert.equal((await manager.generate(REQUEST)).provider, "a");
    assert.equal(a.calls.length, 2);
    assert.deepEqual(sleeps, [500]);
  });

  it("server error that keeps failing: exactly one retry, then fallback (no loop)", async () => {
    const a = makeProvider("a", [httpError(500)]);
    const b = makeProvider("b", [ok("B")]);
    const { manager } = makeManager([a, b]);

    assert.equal((await manager.generate(REQUEST)).provider, "b");
    assert.equal(a.calls.length, 2);
  });

  it("network failure: one retry, then fallback", async () => {
    const a = makeProvider("a", [Object.assign(new Error("socket"), { code: "ECONNRESET" })]);
    const b = makeProvider("b", [ok("B")]);
    const { manager } = makeManager([a, b]);

    assert.equal((await manager.generate(REQUEST)).provider, "b");
    assert.equal(a.calls.length, 2);
  });

  it("authentication error: logged as a configuration problem without the key, then fallback", async () => {
    const key = "sk-test-ABCDEFGHIJKLMNOP";
    const a = makeProvider("a", [httpError(401, `Incorrect API key provided: ${key}. Authorization: Bearer ${key}`)]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, log } = makeManager([a, b], { secrets: [key] });

    assert.equal((await manager.generate(REQUEST)).provider, "b");
    assert.equal(a.calls.length, 1);
    assert.match(log.text(), /configuration problem/);
    assert.ok(!log.text().includes(key), "the API key must never reach the logs");
  });

  it("bad request (400) and unknown errors are not retried but still fall back", async () => {
    const a = makeProvider("a", [httpError(400, "invalid request")]);
    const b = makeProvider("b", [new Error("something odd")]);
    const c = makeProvider("c", [ok("C")]);
    const { manager } = makeManager([a, b, c]);

    assert.equal((await manager.generate(REQUEST)).provider, "c");
    assert.deepEqual([a.calls.length, b.calls.length], [1, 1]);
  });

  it("one retry budget per provider: two failing validation attempts cannot multiply retries", async () => {
    const a = makeProvider("a", [httpError(500)]);
    const { manager } = makeManager([a]);

    await assert.rejects(
      manager.run(async ({ generate }) => {
        await generate(REQUEST); // first call: 1 try + 1 retry, then throws
      }),
      (err) => err.statusCode === 502
    );
    assert.equal(a.calls.length, 2);
  });

  it("stops when the overall time budget is used up instead of trying every provider", async () => {
    const clock = { t: 0 };
    const a = makeProvider("a", [
      () => {
        clock.t += 9_500;
        throw httpError(503);
      },
    ]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, log } = makeManager([a, b], { now: () => clock.t, totalTimeoutMs: 10_000 });

    await assert.rejects(manager.generate(REQUEST), (err) => err.statusCode === 502);
    assert.equal(a.calls.length, 1, "no retry once the budget is nearly gone");
    assert.equal(b.calls.length, 0);
    assert.match(log.text(), /time budget/);
  });
});

describe("provider manager: invalid output and deliberate answers", () => {
  it("InvalidOutputError (malformed recipe) from one provider falls back to the next", async () => {
    const a = makeProvider("a", [ok("not json")]);
    const b = makeProvider("b", [ok("B")]);
    const { manager } = makeManager([a, b]);

    const result = await manager.run(async ({ provider, generate }) => {
      const out = await generate(REQUEST);
      if (provider.name === "a") throw new InvalidOutputError("the response was not valid JSON");
      return out;
    });

    assert.equal(result.provider, "b");
  });

  it("every provider returning unusable output: 502 with the 'valid recipe' message", async () => {
    const { manager } = makeManager([makeProvider("a", [ok()]), makeProvider("b", [ok()])]);

    await assert.rejects(
      manager.run(async () => {
        throw new InvalidOutputError("bad");
      }),
      (err) => err.statusCode === 502 && err.message === INVALID_OUTPUT_MESSAGE
    );
  });

  it("a deliberate ApiError (such as 422 'not a dish') ends the request: no fallback", async () => {
    const a = makeProvider("a", [ok()]);
    const b = makeProvider("b", [ok()]);
    const { manager } = makeManager([a, b]);

    await assert.rejects(
      manager.run(async ({ generate }) => {
        await generate(REQUEST);
        throw new ApiError(422, "not a dish");
      }),
      (err) => err.statusCode === 422
    );
    assert.equal(b.calls.length, 0);
  });

  it("logs fallback decisions without prompts or API keys", async () => {
    const key = "gsk_abcdefghijklmnop12345";
    const a = makeProvider("a", [httpError(402, `quota for ${key}`)]);
    const b = makeProvider("b", [ok("B")]);
    const { manager, log } = makeManager([a, b], { secrets: [key] });

    await manager.generate({ ...REQUEST, messages: [{ role: "user", content: "MY-PRIVATE-PROMPT" }] });

    const text = log.text();
    assert.match(text, /Trying provider a/);
    assert.match(text, /Provider a failed.*"category":"quota_exhausted".*"status":402/);
    assert.match(text, /Trying provider b/);
    assert.match(text, /Provider b succeeded/);
    assert.ok(!text.includes(key));
    assert.ok(!text.includes("MY-PRIVATE-PROMPT"));
    assert.ok(Object.values(ERROR_CATEGORIES).includes("quota_exhausted"));
  });
});
