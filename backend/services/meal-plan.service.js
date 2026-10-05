import { getPrisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-response.js";
import { addDays, formatDateOnly, inclusiveDayCount } from "../utils/dates.js";

export const MAX_PLAN_DAYS = 31;
export const MAX_ENTRIES_PER_PLAN = 100;

// Every query below includes the owner's userId (directly or through the plan), so a plan or
// entry that belongs to someone else behaves exactly like one that does not exist.

const entryInclude = {
  recipe: {
    select: { id: true, title: true, difficulty: true, prepTimeMinutes: true, cookTimeMinutes: true, servings: true },
  },
};

function toEntryDto(entry) {
  return {
    id: entry.id,
    date: formatDateOnly(entry.date),
    recipe: {
      id: entry.recipe.id,
      title: entry.recipe.title,
      difficulty: entry.recipe.difficulty.toLowerCase(),
      prepTime: entry.recipe.prepTimeMinutes,
      cookTime: entry.recipe.cookTimeMinutes,
      servings: entry.recipe.servings,
    },
  };
}

function toPlanDto(plan, entryCount) {
  return {
    id: plan.id,
    name: plan.name,
    startDate: formatDateOnly(plan.startDate),
    endDate: formatDateOnly(plan.endDate),
    entryCount,
    createdAt: plan.createdAt,
  };
}

function assertValidRange(startDate, endDate) {
  if (endDate < startDate) throw new ApiError(400, "endDate must not be before startDate");
  if (inclusiveDayCount(startDate, endDate) > MAX_PLAN_DAYS) {
    throw new ApiError(400, `A meal plan can cover at most ${MAX_PLAN_DAYS} days`);
  }
}

async function findOwnPlan(userId, id) {
  const plan = await getPrisma().mealPlan.findFirst({ where: { id, userId } });
  if (!plan) throw new ApiError(404, "Meal plan not found");
  return plan;
}

function assertDateInPlan(plan, date) {
  if (date < plan.startDate || date > plan.endDate) {
    throw new ApiError(400, `date must be within the plan (${formatDateOnly(plan.startDate)} to ${formatDateOnly(plan.endDate)})`);
  }
}

async function assertOwnsRecipe(userId, recipeId) {
  const recipe = await getPrisma().recipe.findFirst({ where: { id: recipeId, userId }, select: { id: true } });
  if (!recipe) throw new ApiError(404, "Recipe not found");
}

export async function createMealPlan(userId, { name, startDate, endDate }) {
  const end = endDate ?? addDays(startDate, 6);
  assertValidRange(startDate, end);
  const plan = await getPrisma().mealPlan.create({ data: { userId, name, startDate, endDate: end } });
  return { ...toPlanDto(plan, 0), entries: [] };
}

export async function listMealPlans(userId, { limit }) {
  const plans = await getPrisma().mealPlan.findMany({
    where: { userId },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { _count: { select: { entries: true } } },
  });
  return plans.map((plan) => toPlanDto(plan, plan._count.entries));
}

export async function getMealPlan(userId, id) {
  const plan = await getPrisma().mealPlan.findFirst({
    where: { id, userId },
    include: { entries: { orderBy: [{ date: "asc" }, { createdAt: "asc" }], include: entryInclude } },
  });
  if (!plan) throw new ApiError(404, "Meal plan not found");
  return { ...toPlanDto(plan, plan.entries.length), entries: plan.entries.map(toEntryDto) };
}

export async function updateMealPlan(userId, id, patch) {
  const plan = await findOwnPlan(userId, id);
  const startDate = patch.startDate ?? plan.startDate;
  const endDate = patch.endDate ?? plan.endDate;
  assertValidRange(startDate, endDate);

  if (patch.startDate || patch.endDate) {
    // Shrinking the plan must not silently drop planned recipes.
    const outside = await getPrisma().mealPlanEntry.count({
      where: { mealPlanId: id, OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }] },
    });
    if (outside > 0) {
      throw new ApiError(409, `${outside} planned recipe(s) are outside the new dates. Move or remove them first.`);
    }
  }

  await getPrisma().mealPlan.updateMany({
    where: { id, userId },
    data: { ...(patch.name ? { name: patch.name } : {}), startDate, endDate },
  });
  return getMealPlan(userId, id);
}

export async function deleteMealPlan(userId, id) {
  // Entries are removed by the database (ON DELETE CASCADE). Shopping lists made from the plan are kept.
  const { count } = await getPrisma().mealPlan.deleteMany({ where: { id, userId } });
  if (count === 0) throw new ApiError(404, "Meal plan not found");
}

export async function addEntry(userId, planId, { recipeId, date }) {
  const plan = await findOwnPlan(userId, planId);
  assertDateInPlan(plan, date);
  await assertOwnsRecipe(userId, recipeId);

  const entryCount = await getPrisma().mealPlanEntry.count({ where: { mealPlanId: planId } });
  if (entryCount >= MAX_ENTRIES_PER_PLAN) {
    throw new ApiError(409, `A meal plan can hold at most ${MAX_ENTRIES_PER_PLAN} recipes`);
  }

  try {
    const entry = await getPrisma().mealPlanEntry.create({
      data: { mealPlanId: planId, recipeId, date },
      include: entryInclude,
    });
    return toEntryDto(entry);
  } catch (err) {
    if (err.code === "P2002") throw new ApiError(409, "That recipe is already planned for this day");
    if (err.code === "P2003") throw new ApiError(404, "Recipe not found");
    throw err;
  }
}

export async function updateEntry(userId, planId, entryId, patch) {
  const plan = await findOwnPlan(userId, planId);
  if (patch.date) assertDateInPlan(plan, patch.date);
  if (patch.recipeId) await assertOwnsRecipe(userId, patch.recipeId);

  try {
    const { count } = await getPrisma().mealPlanEntry.updateMany({
      where: { id: entryId, mealPlanId: planId },
      data: { ...(patch.date ? { date: patch.date } : {}), ...(patch.recipeId ? { recipeId: patch.recipeId } : {}) },
    });
    if (count === 0) throw new ApiError(404, "Meal plan entry not found");
  } catch (err) {
    if (err.code === "P2002") throw new ApiError(409, "That recipe is already planned for this day");
    if (err.code === "P2003") throw new ApiError(404, "Recipe not found");
    throw err;
  }

  const entry = await getPrisma().mealPlanEntry.findFirst({ where: { id: entryId, mealPlanId: planId }, include: entryInclude });
  if (!entry) throw new ApiError(404, "Meal plan entry not found");
  return toEntryDto(entry);
}

export async function deleteEntry(userId, planId, entryId) {
  const { count } = await getPrisma().mealPlanEntry.deleteMany({
    where: { id: entryId, mealPlanId: planId, mealPlan: { userId } },
  });
  if (count === 0) throw new ApiError(404, "Meal plan entry not found");
}
