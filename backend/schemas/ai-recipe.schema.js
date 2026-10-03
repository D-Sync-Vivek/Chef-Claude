import { z } from "zod";

// Describes what we accept FROM THE MODEL. The model is untrusted: every field is checked,
// lightly normalized (trim, case, numbers-as-text) and anything else is rejected.

const requiredText = (label, max) =>
  z
    .string({ error: `${label} must be a string` })
    .trim()
    .min(1, { error: `${label} must not be empty` })
    .max(max, { error: `${label} must be at most ${max} characters` });

// Models often return quantity as a number (2) or null; accept both, store text or null.
const optionalText = (label, max) =>
  z
    .union([z.string(), z.number()], { error: `${label} must be text` })
    .nullish()
    .transform((value) => {
      if (value == null) return null;
      const text = String(value).trim();
      return text === "" ? null : text;
    })
    .pipe(z.string().max(max, { error: `${label} must be at most ${max} characters` }).nullable());

const minutes = (label) =>
  z
    .number({ error: `${label} must be a whole number of minutes` })
    .int({ error: `${label} must be a whole number of minutes` })
    .min(0, { error: `${label} must not be negative` })
    .max(1440, { error: `${label} must be at most 1440 minutes` });

// "1. Chop onions" / "Step 2: ..." prefixes are display concerns, not data.
const stripStepNumber = (text) => text.replace(/^\s*(?:step\s*)?\d+\s*[.):-]\s*/i, "").trim();

export const aiRecipeSchema = z.object({
  title: requiredText("title", 120),
  description: requiredText("description", 500),
  prepTime: minutes("prepTime"),
  cookTime: minutes("cookTime"),
  servings: z
    .number({ error: "servings must be a whole number" })
    .int({ error: "servings must be a whole number" })
    .min(1, { error: "servings must be at least 1" })
    .max(50, { error: "servings must be at most 50" }),
  difficulty: z
    .string({ error: 'difficulty must be "easy", "medium" or "hard"' })
    .trim()
    .toLowerCase()
    .pipe(z.enum(["easy", "medium", "hard"], { error: 'difficulty must be "easy", "medium" or "hard"' })),
  ingredients: z
    .array(
      z.object({
        name: requiredText("ingredient name", 100),
        quantity: optionalText("ingredient quantity", 40),
        unit: optionalText("ingredient unit", 40),
      }),
      { error: "ingredients must be an array" }
    )
    .min(1, { error: "ingredients must contain at least one item" })
    .max(40, { error: "ingredients must contain at most 40 items" }),
  instructions: z
    .array(requiredText("instruction step", 1000).transform(stripStepNumber).pipe(z.string().min(1)), {
      error: "instructions must be an array of strings",
    })
    .min(1, { error: "instructions must contain at least one step" })
    .max(30, { error: "instructions must contain at most 30 steps" }),
});
