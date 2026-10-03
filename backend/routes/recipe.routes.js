import { Router } from "express";
import {
  deleteRecipe,
  generateRecipe,
  getRecipe,
  listRecipes,
} from "../controllers/recipe.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import {
  generateRecipeRequestSchema,
  listRecipesQuerySchema,
  recipeIdParamsSchema,
} from "../schemas/recipe.schema.js";

const router = Router();

router.use(requireAuth); // every recipe route needs a logged-in user

router.post("/generate", validateBody(generateRecipeRequestSchema), generateRecipe);
router.get("/", validateQuery(listRecipesQuerySchema), listRecipes);
router.get("/:id", validateParams(recipeIdParamsSchema), getRecipe);
router.delete("/:id", validateParams(recipeIdParamsSchema), deleteRecipe);

export default router;
