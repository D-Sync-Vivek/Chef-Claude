import { Router } from "express";
import * as controller from "../controllers/meal-plan.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import { idParamsSchema, limitQuerySchema } from "../schemas/common.schema.js";
import {
  createEntrySchema,
  createMealPlanSchema,
  entryParamsSchema,
  updateEntrySchema,
  updateMealPlanSchema,
} from "../schemas/meal-plan.schema.js";

const router = Router();
router.use(requireAuth);

router.get("/", validateQuery(limitQuerySchema), controller.listPlans);
router.post("/", validateBody(createMealPlanSchema), controller.createPlan);
router.get("/:id", validateParams(idParamsSchema), controller.getPlan);
router.patch("/:id", validateParams(idParamsSchema), validateBody(updateMealPlanSchema), controller.updatePlan);
router.delete("/:id", validateParams(idParamsSchema), controller.deletePlan);

router.post("/:id/entries", validateParams(idParamsSchema), validateBody(createEntrySchema), controller.addEntry);
router.patch("/:id/entries/:entryId", validateParams(entryParamsSchema), validateBody(updateEntrySchema), controller.updateEntry);
router.delete("/:id/entries/:entryId", validateParams(entryParamsSchema), controller.deleteEntry);

export default router;
