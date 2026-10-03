import { getPrisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-response.js";

// Every function takes the owner's userId from the authenticated session and puts it in
// the query's WHERE clause, so one user can never read or delete another user's recipe.

const fullInclude = {
  ingredients: { orderBy: { position: "asc" } },
  instructions: { orderBy: { stepNumber: "asc" } },
};

function toRecipeDto(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTimeMinutes,
    cookTime: recipe.cookTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty.toLowerCase(),
    ingredients: recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
    instructions: recipe.instructions.map((step) => step.text),
    createdAt: recipe.createdAt,
  };
}

function toRecipeSummaryDto(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTimeMinutes,
    cookTime: recipe.cookTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty.toLowerCase(),
    createdAt: recipe.createdAt,
  };
}

// `recipe` must already be validated (see schemas/ai-recipe.schema.js).
export async function createRecipeForUser(userId, recipe) {
  // One nested create = one database transaction: either everything is saved or nothing is.
  const created = await getPrisma().recipe.create({
    data: {
      userId,
      title: recipe.title,
      description: recipe.description,
      prepTimeMinutes: recipe.prepTime,
      cookTimeMinutes: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty.toUpperCase(),
      ingredients: {
        create: recipe.ingredients.map((ingredient, index) => ({
          position: index + 1,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        })),
      },
      instructions: {
        create: recipe.instructions.map((text, index) => ({ stepNumber: index + 1, text })),
      },
    },
    include: fullInclude,
  });
  return toRecipeDto(created);
}

export async function listRecipesForUser(userId, { limit, cursor }) {
  // Fetch one extra row to learn whether another page exists.
  const rows = await getPrisma().recipe.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    recipes: page.map(toRecipeSummaryDto),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

// Someone else's recipe and a missing recipe both give 404, so ids cannot be probed.
export async function getRecipeForUser(userId, id) {
  const recipe = await getPrisma().recipe.findFirst({ where: { id, userId }, include: fullInclude });
  if (!recipe) throw new ApiError(404, "Recipe not found");
  return toRecipeDto(recipe);
}

export async function deleteRecipeForUser(userId, id) {
  // Ingredients and steps are removed by the database (ON DELETE CASCADE).
  const { count } = await getPrisma().recipe.deleteMany({ where: { id, userId } });
  if (count === 0) throw new ApiError(404, "Recipe not found");
}
