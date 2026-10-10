import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { errorHandler } from "../middleware/error.middleware.js";
import { INVALID_OUTPUT_MESSAGE, UNAVAILABLE_MESSAGE } from "../services/ai/provider-manager.js";
import { generateStructuredRecipe } from "../services/recipe-ai.service.js";
import { RECIPE, RECIPE_JSON, httpError, makeManager, makeProvider, ok } from "./helpers.js";

// Silence the service's own diagnostics (they are checked through behaviour, not output).
beforeEach((t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "error", () => {});
});

const ingredientsRequest = (manager) => ({ mode: "ingredients", ingredients: ["rice", "chicken"], preferences: {}, manager });
const dishRequest = (manager, preferences = {}) => ({ mode: "dish", dishName: "Chicken Biryani", preferences, manager });

describe("recipe generation through the provider manager", () => {
  it("8. dish-name mode ('Chicken Biryani') uses the manager and the dish prompt", async () => {
    const a = makeProvider("a", [ok()]);
    const { manager } = makeManager([a]);

    const recipe = await generateStructuredRecipe(dishRequest(manager));

    assert.equal(recipe.title, "Chicken Biryani");
    const [system, user] = a.calls[0].messages;
    assert.equal(system.role, "system");
    assert.match(system.content, /name of a dish/);
    assert.match(user.content, /Dish name \(JSON\): "Chicken Biryani"/);
    assert.equal(a.calls[0].maxTokens, 1500);
    assert.equal(a.calls[0].temperature, 0.4);
  });

  it("9. ingredient mode still works through the same manager", async () => {
    const a = makeProvider("a", [ok()]);
    const { manager } = makeManager([a]);

    const recipe = await generateStructuredRecipe(ingredientsRequest(manager));

    assert.equal(recipe.servings, 4);
    assert.match(a.calls[0].messages[1].content, /Ingredients I have \(JSON\): \["rice","chicken"\]/);
    assert.doesNotMatch(a.calls[0].messages[0].content, /name of a dish/);
  });

  for (const [label, build] of [["ingredient", ingredientsRequest], ["dish-name", dishRequest]]) {
    it(`${label} mode falls back when the primary provider has no credits (402)`, async () => {
      const a = makeProvider("a", [httpError(402, "You have no remaining credits.")]);
      const b = makeProvider("b", [ok()]);
      const { manager } = makeManager([a, b]);

      const recipe = await generateStructuredRecipe(build(manager));

      assert.equal(recipe.title, RECIPE.title);
      assert.equal(a.calls.length, 1);
      assert.equal(b.calls.length, 1);
    });
  }

  it("every provider's output ends up in the same validated shape", async () => {
    const a = makeProvider("a", [httpError(429)]);
    const b = makeProvider("b", [ok(JSON.stringify({ ...RECIPE, difficulty: "MEDIUM", instructions: ["1. Marinate.", "Step 2: Cook."] }))]);
    const { manager } = makeManager([a, b]);

    const recipe = await generateStructuredRecipe(ingredientsRequest(manager));

    assert.deepEqual(Object.keys(recipe).sort(), ["cookTime", "description", "difficulty", "ingredients", "instructions", "prepTime", "servings", "title"]);
    assert.equal(recipe.difficulty, "medium");
    assert.deepEqual(recipe.instructions, ["Marinate.", "Cook."]);
    assert.deepEqual(recipe.ingredients[1], { name: "chicken", quantity: "500", unit: "g" });
  });
});

describe("malformed output: existing validation and retry, then fallback", () => {
  it("invalid JSON: retried once on the same provider with feedback, then succeeds", async () => {
    const a = makeProvider("a", [ok("Sure! Here is a recipe"), ok()]);
    const b = makeProvider("b", [ok()]);
    const { manager } = makeManager([a, b]);

    const recipe = await generateStructuredRecipe(ingredientsRequest(manager));

    assert.equal(recipe.title, RECIPE.title);
    assert.equal(a.calls.length, 2);
    assert.equal(b.calls.length, 0);
    const retryMessages = a.calls[1].messages;
    assert.equal(retryMessages.length, 4);
    assert.equal(retryMessages[2].role, "assistant");
    assert.match(retryMessages[3].content, /Your previous response was rejected: the response was not valid JSON/);
  });

  it("still invalid after the retry: falls back to the next provider with a fresh conversation", async () => {
    const a = makeProvider("a", [ok("nope")]);
    const b = makeProvider("b", [ok()]);
    const { manager } = makeManager([a, b]);

    const recipe = await generateStructuredRecipe(ingredientsRequest(manager));

    assert.equal(recipe.title, RECIPE.title);
    assert.equal(a.calls.length, 2, "MAX_ATTEMPTS per provider is unchanged");
    assert.equal(b.calls.length, 1);
    assert.equal(b.calls[0].messages.length, 2, "the next provider starts from the original messages, not A's feedback chain");
  });

  it("missing required fields are rejected by the existing schema, then retried", async () => {
    const { title, ...withoutTitle } = RECIPE;
    const a = makeProvider("a", [ok(JSON.stringify(withoutTitle)), ok()]);
    const { manager } = makeManager([a]);

    await generateStructuredRecipe(ingredientsRequest(manager));

    assert.match(a.calls[1].messages[3].content, /title/);
  });

  it("a truncated reply (finish reason 'length') is not accepted", async () => {
    const a = makeProvider("a", [ok(RECIPE_JSON, "length"), ok()]);
    const { manager } = makeManager([a]);

    await generateStructuredRecipe(ingredientsRequest(manager));

    assert.match(a.calls[1].messages[3].content, /cut off/);
  });

  it("preference violations (servings) are still enforced", async () => {
    const a = makeProvider("a", [ok(), ok(JSON.stringify({ ...RECIPE, servings: 2 }))]);
    const { manager } = makeManager([a]);

    const recipe = await generateStructuredRecipe(dishRequest(manager, { servings: 2 }));

    assert.equal(recipe.servings, 2);
    assert.match(a.calls[1].messages[3].content, /servings must be exactly 2 but was 4/);
  });

  it("health claims are still rejected", async () => {
    const claimed = ok(JSON.stringify({ ...RECIPE, description: "Only 300 calories per serving." }));
    const a = makeProvider("a", [claimed, ok()]);
    const { manager } = makeManager([a]);

    await generateStructuredRecipe(ingredientsRequest(manager));

    assert.match(a.calls[1].messages[3].content, /unsupported nutrition or health claims/);
  });

  it("'not a dish' ends the request with 422 and does not try other providers", async () => {
    const a = makeProvider("a", [ok('{"error":"not_a_dish"}')]);
    const b = makeProvider("b", [ok()]);
    const { manager } = makeManager([a, b]);

    await assert.rejects(generateStructuredRecipe({ ...dishRequest(manager), dishName: "asdkjh" }), (err) => err.statusCode === 422);
    assert.equal(a.calls.length, 1);
    assert.equal(b.calls.length, 0);
  });
});

describe("all providers failing", () => {
  function runHandler(err) {
    const res = { statusCode: undefined, payload: undefined, status(code) { this.statusCode = code; return this; }, json(body) { this.payload = body; return this; } };
    errorHandler(err, { method: "POST", originalUrl: "/api/recipes/generate" }, res, () => {});
    return res;
  }

  it("provider failures: the client gets 502 with the clean message and nothing provider-specific", async () => {
    const { manager } = makeManager([
      makeProvider("a", [httpError(402, "You have no remaining credits. Purchase pre-paid credits (Qwen2.5 featherless-ai)")]),
      makeProvider("b", [httpError(429, "gsk_abcdefghijklmnopqrstuv rate limited")]),
      makeProvider("c", [new Error("socket hang up")]),
    ]);

    const err = await generateStructuredRecipe(ingredientsRequest(manager)).catch((e) => e);
    const res = runHandler(err);

    assert.equal(res.statusCode, 502);
    assert.deepEqual(res.payload, { success: false, error: { message: UNAVAILABLE_MESSAGE } });
  });

  it("every provider answered but nothing valid: 502 with the existing 'valid recipe' message", async () => {
    const { manager } = makeManager([makeProvider("a", [ok("x")]), makeProvider("b", [ok("y")])]);

    const err = await generateStructuredRecipe(ingredientsRequest(manager)).catch((e) => e);

    assert.equal(err.statusCode, 502);
    assert.equal(err.message, INVALID_OUTPUT_MESSAGE);
  });

  it("no provider configured: reported as a server configuration problem (500)", async () => {
    const { manager } = makeManager([makeProvider("a", [ok()], { configured: false })]);

    const err = await generateStructuredRecipe(ingredientsRequest(manager)).catch((e) => e);

    assert.equal(err.statusCode, 500);
  });
});
