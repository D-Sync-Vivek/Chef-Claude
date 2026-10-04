import { getPrisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-response.js";
import { buildRecipeFilter, summaryInclude, toRecipeSummaryDto } from "../utils/recipe-shape.js";

// Recipes are private, so a user may only favorite recipes they own. A recipe that is
// missing and a recipe owned by someone else both give 404, so ids cannot be probed.
async function assertOwnsRecipe(userId, recipeId) {
  const recipe = await getPrisma().recipe.findFirst({ where: { id: recipeId, userId }, select: { id: true } });
  if (!recipe) throw new ApiError(404, "Recipe not found");
}

// Idempotent. Returns { created: false } if it was already a favorite.
export async function addFavorite(userId, recipeId) {
  await assertOwnsRecipe(userId, recipeId);
  try {
    // ON CONFLICT DO NOTHING: safe even if two requests arrive at the same time.
    const { count } = await getPrisma().favorite.createMany({
      data: [{ userId, recipeId }],
      skipDuplicates: true,
    });
    return { created: count === 1 };
  } catch (err) {
    // P2003 = foreign key violation: the recipe was deleted a moment ago.
    if (err.code === "P2003") throw new ApiError(404, "Recipe not found");
    throw err;
  }
}

// Idempotent: removing a favorite that does not exist is not an error.
export async function removeFavorite(userId, recipeId) {
  await assertOwnsRecipe(userId, recipeId);
  await getPrisma().favorite.deleteMany({ where: { userId, recipeId } });
}

// Most recently favorited first.
export async function listFavoritesForUser(userId, { limit, cursor, q, difficulty }) {
  const rows = await getPrisma().favorite.findMany({
    where: { userId, recipe: { userId, ...buildRecipeFilter({ q, difficulty }) } },
    orderBy: [{ createdAt: "desc" }, { recipeId: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { userId_recipeId: { userId, recipeId: cursor } }, skip: 1 } : {}),
    include: { recipe: { include: summaryInclude(userId) } },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    recipes: page.map((row) => toRecipeSummaryDto(row.recipe)),
    nextCursor: hasMore ? page[page.length - 1].recipeId : null,
  };
}
