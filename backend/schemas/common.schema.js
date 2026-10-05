import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.uuid({ error: "id is not valid" }),
});

export const limitQuerySchema = z.object({
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int({ error: "limit must be a whole number" })
    .min(1, { error: "limit must be at least 1" })
    .max(50, { error: "limit must be at most 50" })
    .default(20),
});
