import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-response.js";
import { createUser, findPublicUserById, findUserByEmail } from "./user.service.js";

const BCRYPT_COST = 12;
const JWT_ALGORITHM = "HS256";

// Compared against when the email is unknown so login takes similar time either way.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

function requireJwtSecret() {
  if (env.jwtSecret.length < 32) {
    throw new ApiError(500, "Authentication is not configured");
  }
  return env.jwtSecret;
}

export function signAuthToken(userId) {
  return jwt.sign({ sub: userId }, requireJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.authTokenTtlSeconds,
  });
}

// Returns the user id from a valid token, or null for any invalid/expired/tampered token.
export function verifyAuthToken(token) {
  try {
    const payload = jwt.verify(token, requireJwtSecret(), { algorithms: [JWT_ALGORITHM] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return null;
  }
}

export async function registerUser({ name, email, password }) {
  requireJwtSecret();
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    return await createUser({ name, email, passwordHash });
  } catch (err) {
    // P2002 = unique constraint violation; the database is the source of truth, which also covers races.
    if (err.code === "P2002") {
      throw new ApiError(409, "An account with this email already exists");
    }
    throw err;
  }
}

export async function authenticateUser({ email, password }) {
  requireJwtSecret();
  const user = await findUserByEmail(email);
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // Same message for unknown email and wrong password so accounts cannot be enumerated.
  if (!user || !passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function getAuthenticatedUser(token) {
  const userId = verifyAuthToken(token);
  if (!userId) return null;
  return findPublicUserById(userId);
}
