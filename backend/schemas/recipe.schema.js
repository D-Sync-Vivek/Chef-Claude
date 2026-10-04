import { z } from "zod";
import { aiRecipeSchema } from "./ai-recipe.schema.js";

export const MAX_INGREDIENTS = 20;
export const MAX_INGREDIENT_LENGTH = 50;
export const DIFFICULTIES = ["easy", "medium", "hard"];

const ingredientList = z
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
      .max(MAX_INGREDIENTS, { error: `Provide at most ${MAX_INGREDIENTS} ingredients` })
  );

// Unknown keys (such as a client-supplied userId) are stripped, never used.
export const generateRecipeRequestSchema = z.object({
  ingredients: ingredientList,
  servings: z
    .number({ error: "servings must be a number" })
    .int({ error: "servings must be a whole number" })
    .min(1, { error: "servings must be at least 1" })
    .max(20, { error: "servings must be at most 20" })
    .optional(),
  difficulty: z.enum(DIFFICULTIES, { error: `difficulty must be one of: ${DIFFICULTIES.join(", ")}` }).optional(),
  // Upper bound for the recipe's cookTime, in minutes.
  maxCookingTime: z
    .number({ error: "maxCookingTime must be a number" })
    .int({ error: "maxCookingTime must be a whole number of minutes" })
    .min(1, { error: "maxCookingTime must be at least 1 minute" })
    .max(600, { error: "maxCookingTime must be at most 600 minutes" })
    .optional(),
});

export const recipeIdParamsSchema = z.object({
  id: z.uuid({ error: "Recipe id is not valid" }),
});

export const listRecipesQuerySchema = z.object({
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int({ error: "limit must be a whole number" })
    .min(1, { error: "limit must be at least 1" })
    .max(50, { error: "limit must be at most 50" })
    .default(20),
  cursor: z.uuid({ error: "cursor is not valid" }).optional(),
  // Optional filters: text matches the title or an ingredient name; difficulty matches exactly.
  q: z
    .string()
    .trim()
    .max(100, { error: "Search text must be at most 100 characters" })
    .optional()
    .transform((value) => value || undefined),
  difficulty: z.enum(DIFFICULTIES, { error: `difficulty must be one of: ${DIFFICULTIES.join(", ")}` }).optional(),
});

export const MIN_INSTRUCTION_LENGTH = 3;
export const MAX_INSTRUCTION_LENGTH = 300;

export const transformRequestSchema = z.object({
  instruction: z
    .string({ error: "instruction is required" })
    .trim()
    .min(MIN_INSTRUCTION_LENGTH, { error: `instruction must be at least ${MIN_INSTRUCTION_LENGTH} characters` })
    .max(MAX_INSTRUCTION_LENGTH, { error: `instruction must be at most ${MAX_INSTRUCTION_LENGTH} characters` }),
});

// The recipe is checked and cleaned by the same schema used for AI output. The owner is never
// part of the body: it always comes from the login session.
export const saveTransformedRequestSchema = z.object({
  mode: z.enum(["new", "replace"], { error: 'mode must be "new" or "replace"' }),
  recipe: aiRecipeSchema,
});
