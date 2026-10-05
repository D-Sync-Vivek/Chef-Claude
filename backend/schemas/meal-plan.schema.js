import { z } from "zod";
import { parseDateOnly } from "../utils/dates.js";

// Real calendar dates only ("2026-02-30" is rejected), converted to UTC-midnight Date objects.
const dateOnly = z.iso.date({ error: "Dates must be real dates in YYYY-MM-DD format" }).transform(parseDateOnly);

const planName = z
  .string({ error: "name is required" })
  .trim()
  .min(1, { error: "name must not be empty" })
  .max(80, { error: "name must be at most 80 characters" });

const atLeastOneField = [(body) => Object.keys(body).length > 0, { error: "Provide at least one field to change" }];

// Whether the dates form a valid range is checked in the service, together with the stored dates.
export const createMealPlanSchema = z.object({
  name: planName,
  startDate: dateOnly,
  endDate: dateOnly.optional(), // defaults to a 7-day plan
});

export const updateMealPlanSchema = z
  .object({ name: planName.optional(), startDate: dateOnly.optional(), endDate: dateOnly.optional() })
  .refine(...atLeastOneField);

export const createEntrySchema = z.object({
  recipeId: z.uuid({ error: "recipeId is not valid" }),
  date: dateOnly,
});

export const updateEntrySchema = z
  .object({ recipeId: z.uuid({ error: "recipeId is not valid" }).optional(), date: dateOnly.optional() })
  .refine(...atLeastOneField);

export const entryParamsSchema = z.object({
  id: z.uuid({ error: "id is not valid" }),
  entryId: z.uuid({ error: "entryId is not valid" }),
});
