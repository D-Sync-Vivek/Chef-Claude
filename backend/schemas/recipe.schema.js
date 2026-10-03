import { z } from "zod";

export const MAX_INGREDIENTS = 20;
export const MAX_INGREDIENT_LENGTH = 50;

export const recipeRequestSchema = z.object({
  ingredients: z
    .array(
      z.string({ error: "Each ingredient must be a string" }),
      { error: "ingredients must be an array of strings" }
    )
    // Hard cap before any processing so huge payloads are rejected early.
    .max(MAX_INGREDIENTS * 5, { error: "Too many ingredients" })
    .transform((items) => items.map((item) => item.trim()).filter(Boolean))
    .pipe(
      z
        .array(
          z.string().max(MAX_INGREDIENT_LENGTH, {
            error: `Each ingredient must be at most ${MAX_INGREDIENT_LENGTH} characters`,
          })
        )
        .min(1, { error: "Provide at least one non-empty ingredient" })
        .max(MAX_INGREDIENTS, {
          error: `Provide at most ${MAX_INGREDIENTS} ingredients`,
        })
    ),
});
