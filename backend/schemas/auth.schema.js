import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected rather than silently truncated.
const MAX_PASSWORD_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 8;

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(254, { error: "Email is too long" })
  .pipe(z.email({ error: "Enter a valid email address" }));

const newPassword = z
  .string({ error: "Password is required" })
  .min(MIN_PASSWORD_LENGTH, { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
  .refine((value) => Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES, {
    error: `Password must be at most ${MAX_PASSWORD_BYTES} bytes`,
  });

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, { error: "Name is required" })
    .max(80, { error: "Name must be at most 80 characters" }),
  email,
  password: newPassword,
});

// Login does not re-apply password strength rules; it only needs a non-empty, bounded string.
export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Password is required" })
    .min(1, { error: "Password is required" })
    .max(200, { error: "Password is too long" }),
});
