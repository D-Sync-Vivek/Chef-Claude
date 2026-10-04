// How recipes are queried and presented. Shared by recipe.service.js and favorite.service.js.

// `favorites` is limited to the current user's rows, so a non-empty list means "this user favorited it".
const favoriteFlag = (userId) => ({ favorites: { where: { userId }, select: { userId: true } } });

export const summaryInclude = (userId) => ({ ...favoriteFlag(userId) });

export const fullInclude = (userId) => ({
  ingredients: { orderBy: { position: "asc" } },
  instructions: { orderBy: { stepNumber: "asc" } },
  ...favoriteFlag(userId),
});

// Prisma's `contains` becomes a SQL LIKE/ILIKE, so "%" and "_" in user text would act as
// wildcards. Escape them (and the escape character) so the search text is matched literally.
const escapeLike = (text) => text.replace(/[\\%_]/g, "\\$&");

export function buildRecipeFilter({ q, difficulty } = {}) {
  const filter = {};
  if (difficulty) filter.difficulty = difficulty.toUpperCase();
  if (q) {
    const text = escapeLike(q);
    filter.OR = [
      { title: { contains: text, mode: "insensitive" } },
      { ingredients: { some: { name: { contains: text, mode: "insensitive" } } } },
    ];
  }
  return filter;
}

export function toRecipeSummaryDto(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTimeMinutes,
    cookTime: recipe.cookTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty.toLowerCase(),
    isFavorite: recipe.favorites.length > 0,
    createdAt: recipe.createdAt,
  };
}

export function toRecipeDto(recipe) {
  return {
    ...toRecipeSummaryDto(recipe),
    ingredients: recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
    instructions: recipe.instructions.map((step) => step.text),
  };
}
