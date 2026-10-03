import { Router } from "express";
import { createRecipe } from "../controllers/recipe.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { recipeRequestSchema } from "../schemas/recipe.schema.js";

const router = Router();

router.post("/", validateBody(recipeRequestSchema), createRecipe);

export default router;
