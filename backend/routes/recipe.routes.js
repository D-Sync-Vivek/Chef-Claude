import { Router } from "express";
import {
  deleteRecipe,
  generateRecipe,
  getRecipe,
  listRecipes,
} from "../controllers/recipe.controller.js";
import {
  favoriteRecipe,
  listFavorites,
  unfavoriteRecipe,
} from "../controllers/favorite.controller.js";
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
// "/favorites" must be declared before "/:id", otherwise "favorites" would be read as a recipe id.
router.get("/favorites", validateQuery(listRecipesQuerySchema), listFavorites);
router.get("/", validateQuery(listRecipesQuerySchema), listRecipes);
router.get("/:id", validateParams(recipeIdParamsSchema), getRecipe);
router.post("/:id/favorite", validateParams(recipeIdParamsSchema), favoriteRecipe);
router.delete("/:id/favorite", validateParams(recipeIdParamsSchema), unfavoriteRecipe);
router.delete("/:id", validateParams(recipeIdParamsSchema), deleteRecipe);

export default router;
