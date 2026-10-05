import { getPrisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-response.js";
import { aggregateIngredients } from "../utils/ingredient-aggregation.js";

const toItemDto = (item) => ({ id: item.id, name: item.name, quantity: item.quantity, checked: item.checked });

function toListSummaryDto(list) {
  return {
    id: list.id,
    name: list.name,
    mealPlan: list.mealPlan ? { id: list.mealPlan.id, name: list.mealPlan.name } : null,
    itemCount: list.items.length,
    checkedCount: list.items.filter((item) => item.checked).length,
    createdAt: list.createdAt,
  };
}

const mealPlanSelect = { select: { id: true, name: true } };

// Builds a shopping list from (some of) the recipes planned in one of the user's meal plans
// and saves it. The list is a snapshot: it does not change if the recipes change later.
export async function createShoppingListFromPlan(userId, { mealPlanId, entryIds, name }) {
  const prisma = getPrisma();
  const plan = await prisma.mealPlan.findFirst({ where: { id: mealPlanId, userId } });
  if (!plan) throw new ApiError(404, "Meal plan not found");

  const entries = await prisma.mealPlanEntry.findMany({
    where: {
      mealPlanId,
      ...(entryIds ? { id: { in: entryIds } } : {}),
      recipe: { userId }, // defense in depth: only the user's own recipes are ever read
    },
    include: { recipe: { include: { ingredients: { orderBy: { position: "asc" } } } } },
  });

  if (entryIds && entries.length !== entryIds.length) {
    throw new ApiError(404, "Meal plan entry not found");
  }
  if (entries.length === 0) {
    throw new ApiError(400, "Add at least one recipe to the meal plan before creating a shopping list");
  }

  // Each planned entry counts once, so a recipe planned on two days is bought twice.
  const items = aggregateIngredients(
    entries.flatMap((entry) => entry.recipe.ingredients.map(({ name: ingredient, quantity, unit }) => ({ name: ingredient, quantity, unit })))
  );

  const list = await prisma.shoppingList.create({
    data: {
      userId,
      mealPlanId,
      name: name ?? `Shopping list: ${plan.name}`.slice(0, 80),
      items: { create: items.map((item, index) => ({ position: index + 1, name: item.name, quantity: item.quantity })) },
    },
    include: { items: { orderBy: { position: "asc" } }, mealPlan: mealPlanSelect },
  });

  return { ...toListSummaryDto(list), items: list.items.map(toItemDto) };
}

export async function listShoppingLists(userId, { limit }) {
  const lists = await getPrisma().shoppingList.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { items: { select: { checked: true } }, mealPlan: mealPlanSelect },
  });
  return lists.map(toListSummaryDto);
}

export async function getShoppingList(userId, id) {
  const list = await getPrisma().shoppingList.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { position: "asc" } }, mealPlan: mealPlanSelect },
  });
  if (!list) throw new ApiError(404, "Shopping list not found");
  return { ...toListSummaryDto(list), items: list.items.map(toItemDto) };
}

export async function setItemChecked(userId, listId, itemId, checked) {
  const { count } = await getPrisma().shoppingListItem.updateMany({
    where: { id: itemId, shoppingListId: listId, shoppingList: { userId } },
    data: { checked },
  });
  if (count === 0) throw new ApiError(404, "Shopping list item not found");

  const item = await getPrisma().shoppingListItem.findUnique({ where: { id: itemId } });
  return toItemDto(item);
}

export async function deleteShoppingList(userId, id) {
  const { count } = await getPrisma().shoppingList.deleteMany({ where: { id, userId } });
  if (count === 0) throw new ApiError(404, "Shopping list not found");
}
