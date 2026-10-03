import { getPrisma } from "../db/prisma.js";

// Fields that are safe to send to clients. passwordHash is intentionally absent.
const publicUserSelect = { id: true, email: true, name: true, createdAt: true };

export function findUserByEmail(email) {
  // Returns the full row (including passwordHash); only the auth service should use this.
  return getPrisma().user.findUnique({ where: { email } });
}

export function findPublicUserById(id) {
  return getPrisma().user.findUnique({ where: { id }, select: publicUserSelect });
}

export function createUser({ name, email, passwordHash }) {
  return getPrisma().user.create({
    data: { name, email, passwordHash },
    select: publicUserSelect,
  });
}
