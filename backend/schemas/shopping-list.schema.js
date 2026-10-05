import { z } from "zod";

export const createShoppingListSchema = z.object({
  mealPlanId: z.uuid({ error: "mealPlanId is not valid" }),
  // Which planned recipes to shop for. Leave out to use every recipe in the plan.
  entryIds: z
    .array(z.uuid({ error: "entryIds must contain valid ids" }), { error: "entryIds must be an array" })
    .min(1, { error: "entryIds must not be empty" })
    .max(100, { error: "entryIds can contain at most 100 ids" })
    .transform((ids) => [...new Set(ids)])
    .optional(),
  name: z
    .string({ error: "name must be text" })
    .trim()
    .min(1, { error: "name must not be empty" })
    .max(80, { error: "name must be at most 80 characters" })
    .optional(),
});

export const updateItemSchema = z.object({
  checked: z.boolean({ error: "checked must be true or false" }),
});

export const itemParamsSchema = z.object({
  id: z.uuid({ error: "id is not valid" }),
  itemId: z.uuid({ error: "itemId is not valid" }),
});
