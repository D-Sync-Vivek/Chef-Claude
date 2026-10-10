import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import { ERROR_CATEGORIES as C, toProviderError } from "../services/ai/errors.js";
import { createGeminiProvider } from "../services/ai/providers/gemini.js";
import { createGroqProvider } from "../services/ai/providers/groq.js";
import { createHuggingFaceProvider } from "../services/ai/providers/huggingface.js";
import { buildProviders } from "../services/ai/providers/index.js";
import { createOpenAIProvider } from "../services/ai/providers/openai.js";
import { RECIPE_JSON, makeManager } from "./helpers.js";

const MESSAGES = [
  { role: "system", content: "SYSTEM RULES" },
  { role: "user", content: "make a recipe" },
  { role: "assistant", content: "bad answer" },
  { role: "user", content: "fix it" },
];
const REQUEST = { messages: MESSAGES, maxTokens: 1500, temperature: 0.4, timeoutMs: 5000 };

describe("adapters: request shape (fake SDK clients)", () => {
  it("gemini: system prompt -> systemInstruction, assistant -> model, JSON output, abort signal", async () => {
    let sent;
    const client = { models: { generateContent: async (args) => ((sent = args), { text: RECIPE_JSON, candidates: [{ finishReason: "MAX_TOKENS" }] }) } };
    const signal = new AbortController().signal;

    const out = await createGeminiProvider({ apiKey: "k", model: "gemini-x", client }).generate({ ...REQUEST, signal });

    assert.equal(sent.model, "gemini-x");
    assert.deepEqual(sent.contents.map((c) => c.role), ["user", "model", "user"]);
    assert.equal(sent.contents[1].parts[0].text, "bad answer");
    assert.equal(sent.config.systemInstruction, "SYSTEM RULES");
    assert.equal(sent.config.maxOutputTokens, 1500);
    assert.equal(sent.config.temperature, 0.4);
    assert.equal(sent.config.responseMimeType, "application/json");
    assert.equal(sent.config.abortSignal, signal);
    assert.deepEqual(out, { content: RECIPE_JSON, finishReason: "length", provider: "gemini", model: "gemini-x" });
  });

  it("groq: chat messages as-is, JSON mode, no SDK retries, normalized finish reason", async () => {
    let sent, options;
    const client = { chat: { completions: { create: async (body, opts) => ((sent = body), (options = opts), { choices: [{ message: { content: "{}" }, finish_reason: "stop" }] }) } } };
    const signal = new AbortController().signal;

    const out = await createGroqProvider({ apiKey: "k", model: "llama-x", client }).generate({ ...REQUEST, signal });

    assert.deepEqual(sent.messages, MESSAGES);
    assert.equal(sent.max_completion_tokens, 1500);
    assert.deepEqual(sent.response_format, { type: "json_object" });
    assert.deepEqual(options, { signal, timeout: 5000, maxRetries: 0 });
    assert.equal(out.finishReason, "stop");
  });

  it("openai: Responses API with instructions/input, no temperature, store off, reasoning only when set", async () => {
    const sentBodies = [];
    const client = { responses: { create: async (body) => (sentBodies.push(body), { status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output_text: "{" }) } };

    const plain = await createOpenAIProvider({ apiKey: "k", model: "gpt-x", client }).generate(REQUEST);
    await createOpenAIProvider({ apiKey: "k", model: "gpt-x", reasoningEffort: "low", client }).generate(REQUEST);

    const [first, second] = sentBodies;
    assert.equal(first.instructions, "SYSTEM RULES");
    assert.deepEqual(first.input.map((m) => m.role), ["user", "assistant", "user"]);
    assert.equal(first.max_output_tokens, 1500);
    assert.ok(!("temperature" in first));
    assert.ok(!("reasoning" in first));
    assert.equal(first.store, false);
    assert.deepEqual(first.text, { format: { type: "json_object" } });
    assert.deepEqual(second.reasoning, { effort: "low" });
    assert.equal(plain.finishReason, "length");
  });

  it("huggingface: same payload the app sent before the refactor", async () => {
    let sent, options;
    const client = { chatCompletion: async (body, opts) => ((sent = body), (options = opts), { choices: [{ message: { content: "{}" }, finish_reason: "length" }] }) };
    const signal = new AbortController().signal;

    const out = await createHuggingFaceProvider({ apiKey: "k", model: "Qwen/Qwen2.5-7B-Instruct", client }).generate({ ...REQUEST, signal });

    assert.deepEqual(sent, { model: "Qwen/Qwen2.5-7B-Instruct", messages: MESSAGES, max_tokens: 1500, temperature: 0.4 });
    assert.deepEqual(options, { signal });
    assert.equal(out.finishReason, "length");
  });

  it("a provider without an API key or model is not configured", () => {
    for (const create of [createGeminiProvider, createGroqProvider, createHuggingFaceProvider, createOpenAIProvider]) {
      assert.equal(create({ apiKey: "", model: "m" }).isConfigured(), false);
      assert.equal(create({ apiKey: "k", model: "" }).isConfigured(), false);
      assert.equal(create({ apiKey: "k", model: "m" }).isConfigured(), true);
    }
  });
});

describe("buildProviders (AI_PROVIDER_ORDER)", () => {
  const config = { geminiApiKey: "g", geminiModel: "gm", groqApiKey: "", groqModel: "qm", hfAccessToken: "h", hfModel: "hm", openaiApiKey: "o", openaiModel: "om" };
  const silent = { warn: () => {} };

  it("keeps the configured order and keeps unconfigured providers (the manager skips them)", () => {
    const providers = buildProviders(["gemini", "groq", "huggingface", "openai"], config, { logger: silent });
    assert.deepEqual(providers.map((p) => p.name), ["gemini", "groq", "huggingface", "openai"]);
    assert.deepEqual(providers.map((p) => p.isConfigured()), [true, false, true, true]);
  });

  it("changing the order changes priority without touching code", () => {
    assert.deepEqual(buildProviders(["openai", "gemini"], config, { logger: silent }).map((p) => p.name), ["openai", "gemini"]);
  });

  it("accepts the 'hf' alias, drops duplicates, and ignores unknown names with a warning", () => {
    const warnings = [];
    const providers = buildProviders(["hf", "huggingface", "mistral"], config, { logger: { warn: (m) => warnings.push(m) } });
    assert.deepEqual(providers.map((p) => p.name), ["huggingface"]);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Unknown provider "mistral"/);
  });

  it("adding a provider only needs a registry entry", () => {
    const registry = { extra: () => ({ name: "extra", model: "x", isConfigured: () => true }) };
    assert.deepEqual(buildProviders(["extra"], {}, { registry }).map((p) => p.name), ["extra"]);
  });
});

// The real SDKs talk to a local fake server, so these check the SDKs' actual error and response
// shapes (status, headers, JSON body) without any network access or API credits.
describe("real SDKs against a local fake server", () => {
  let server;
  let baseUrl;
  let reply = { status: 200, headers: {}, body: {} };
  let lastRequest;

  before(async () => {
    server = http.createServer((req, res) => {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        lastRequest = { url: req.url, body: raw ? JSON.parse(raw) : undefined };
        if (reply.hang) return; // never answer
        res.writeHead(reply.status, { "content-type": "application/json", ...reply.headers });
        res.end(JSON.stringify(reply.body));
      });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => {
    server.closeAllConnections();
    server.close();
  });

  const makers = {
    async gemini() {
      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: "test-key-not-real", httpOptions: { baseUrl } });
      return createGeminiProvider({ apiKey: "k", model: "gemini-test", client });
    },
    async groq() {
      const { default: Groq } = await import("groq-sdk");
      return createGroqProvider({ apiKey: "k", model: "groq-test", client: new Groq({ apiKey: "test-key-not-real", baseURL: baseUrl, maxRetries: 0 }) });
    },
    async openai() {
      const { default: OpenAI } = await import("openai");
      return createOpenAIProvider({ apiKey: "k", model: "openai-test", client: new OpenAI({ apiKey: "test-key-not-real", baseURL: baseUrl, maxRetries: 0 }) });
    },
  };

  const successBodies = {
    gemini: { candidates: [{ content: { role: "model", parts: [{ text: RECIPE_JSON }] }, finishReason: "STOP" }] },
    groq: { id: "c", object: "chat.completion", created: 1, model: "m", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: RECIPE_JSON } }] },
    openai: {
      id: "r", object: "response", created_at: 1, model: "m", status: "completed", parallel_tool_calls: false, tool_choice: "auto", tools: [],
      output: [{ type: "message", id: "m1", role: "assistant", status: "completed", content: [{ type: "output_text", text: RECIPE_JSON, annotations: [] }] }],
    },
  };

  const errorBodies = {
    402: { error: { message: "You have no remaining credits.", code: "payment_required" } },
    429: { error: { message: "Rate limit reached", type: "requests", code: "rate_limit_exceeded", status: "RESOURCE_EXHAUSTED" } },
    401: { error: { message: "Invalid API key", code: "invalid_api_key", status: "UNAUTHENTICATED" } },
    503: { error: { message: "The model is overloaded", code: "server_error", status: "UNAVAILABLE" } },
  };

  for (const name of Object.keys(makers)) {
    describe(name, () => {
      it("success is normalized to { content, finishReason, provider, model }", async () => {
        reply = { status: 200, headers: {}, body: successBodies[name] };
        const out = await (await makers[name]()).generate(REQUEST);
        assert.equal(out.content, RECIPE_JSON);
        assert.equal(out.finishReason, "stop");
        assert.equal(out.provider, name);
      });

      it("sends the expected wire format", async () => {
        reply = { status: 200, headers: {}, body: successBodies[name] };
        await (await makers[name]()).generate(REQUEST);
        const body = lastRequest.body;
        if (name === "gemini") {
          assert.match(lastRequest.url, /gemini-test:generateContent/);
          assert.equal(body.generationConfig.responseMimeType, "application/json");
          assert.equal(body.systemInstruction.parts[0].text, "SYSTEM RULES");
        } else if (name === "groq") {
          assert.match(lastRequest.url, /chat\/completions/);
          assert.equal(body.response_format.type, "json_object");
          assert.equal(body.max_completion_tokens, 1500);
        } else {
          assert.match(lastRequest.url, /responses/);
          assert.equal(body.text.format.type, "json_object");
          assert.equal(body.instructions, "SYSTEM RULES");
        }
      });

      const expectations = [
        [402, {}, C.QUOTA_EXHAUSTED],
        [429, { "retry-after": "1" }, C.RATE_LIMITED],
        [401, {}, C.AUTH],
        [503, {}, C.SERVER_ERROR],
      ];
      for (const [status, headers, category] of expectations) {
        it(`HTTP ${status} is classified as ${category}`, async () => {
          reply = { status, headers, body: errorBodies[status] };
          const provider = await makers[name]();
          const err = await provider.generate(REQUEST).then(() => assert.fail("should have thrown"), (e) => e);
          const classified = toProviderError(err, { provider: name, model: provider.model });
          assert.equal(classified.category, category);
          assert.equal(classified.status, status);
          // The Gemini SDK's error does not expose response headers, so a Gemini 429 never carries a
          // Retry-After hint and the manager falls back immediately instead of waiting.
          if (status === 429) assert.equal(classified.retryAfterMs, name === "gemini" ? undefined : 1000);
        });
      }

      it("a hanging server is cut off by the manager's timeout (and the request is aborted)", async () => {
        reply = { hang: true };
        const provider = await makers[name]();
        const { manager, log } = makeManager([provider], { timeoutMs: 100 });
        await assert.rejects(manager.generate({ ...REQUEST, timeoutMs: undefined }), (err) => err.statusCode === 502);
        assert.match(log.text(), /"category":"timeout"/);
      });
    });
  }
});
