import { generateStructuredRecipe } from "../services/recipe-ai.service.js";
import {
  createRecipeForUser,
  deleteRecipeForUser,
  getRecipeForUser,
  listRecipesForUser,
} from "../services/recipe.service.js";
import { sendSuccess } from "../utils/api-response.js";

// Ownership always comes from req.user (set by requireAuth), never from the request body.

export async function generateRecipe(req, res, next) {
  try {
    const { ingredients, servings, difficulty, maxCookingTime } = req.body;
    const generated = await generateStructuredRecipe({
      ingredients,
      preferences: { servings, difficulty, maxCookingTime },
    });
    const recipe = await createRecipeForUser(req.user.id, generated);
    return sendSuccess(res, { recipe }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listRecipes(req, res, next) {
  try {
    const { recipes, nextCursor } = await listRecipesForUser(req.user.id, req.validated.query);
    return sendSuccess(res, { recipes, nextCursor });
  } catch (err) {
    next(err);
  }
}

export async function getRecipe(req, res, next) {
  try {
    const recipe = await getRecipeForUser(req.user.id, req.validated.params.id);
    return sendSuccess(res, { recipe });
  } catch (err) {
    next(err);
  }
}

export async function deleteRecipe(req, res, next) {
  try {
    await deleteRecipeForUser(req.user.id, req.validated.params.id);
    return sendSuccess(res, { message: "Recipe deleted" });
  } catch (err) {
    next(err);
  }
}
