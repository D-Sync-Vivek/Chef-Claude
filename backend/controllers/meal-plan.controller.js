import * as mealPlans from "../services/meal-plan.service.js";
import { sendSuccess } from "../utils/api-response.js";

// Ownership always comes from req.user (set by requireAuth), never from the request.
const handler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

export const createPlan = handler(async (req, res) =>
  sendSuccess(res, { mealPlan: await mealPlans.createMealPlan(req.user.id, req.body) }, 201));

export const listPlans = handler(async (req, res) =>
  sendSuccess(res, { mealPlans: await mealPlans.listMealPlans(req.user.id, req.validated.query) }));

export const getPlan = handler(async (req, res) =>
  sendSuccess(res, { mealPlan: await mealPlans.getMealPlan(req.user.id, req.validated.params.id) }));

export const updatePlan = handler(async (req, res) =>
  sendSuccess(res, { mealPlan: await mealPlans.updateMealPlan(req.user.id, req.validated.params.id, req.body) }));

export const deletePlan = handler(async (req, res) => {
  await mealPlans.deleteMealPlan(req.user.id, req.validated.params.id);
  return sendSuccess(res, { message: "Meal plan deleted" });
});

export const addEntry = handler(async (req, res) =>
  sendSuccess(res, { entry: await mealPlans.addEntry(req.user.id, req.validated.params.id, req.body) }, 201));

export const updateEntry = handler(async (req, res) => {
  const { id, entryId } = req.validated.params;
  return sendSuccess(res, { entry: await mealPlans.updateEntry(req.user.id, id, entryId, req.body) });
});

export const deleteEntry = handler(async (req, res) => {
  const { id, entryId } = req.validated.params;
  await mealPlans.deleteEntry(req.user.id, id, entryId);
  return sendSuccess(res, { message: "Entry removed" });
});
