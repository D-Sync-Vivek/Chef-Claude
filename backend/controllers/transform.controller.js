import { transformRecipe } from "../services/recipe-transform.service.js";
import { createRecipeForUser, getRecipeForUser, replaceRecipeForUser } from "../services/recipe.service.js";
import { sendSuccess } from "../utils/api-response.js";

// Ownership always comes from req.user, and the recipe in the URL must belong to that user
// before the AI is called or anything is written.

// Returns a preview only. Nothing is saved.
export async function transform(req, res, next) {
  try {
    const recipe = await getRecipeForUser(req.user.id, req.validated.params.id);
    const result = await transformRecipe({ recipe, instruction: req.body.instruction });
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// Saves a previously previewed recipe, either as a new recipe or over the source recipe.
export async function saveTransformed(req, res, next) {
  try {
    const { id } = req.validated.params;
    await getRecipeForUser(req.user.id, id);

    if (req.body.mode === "replace") {
      const recipe = await replaceRecipeForUser(req.user.id, id, req.body.recipe);
      return sendSuccess(res, { recipe });
    }

    const recipe = await createRecipeForUser(req.user.id, req.body.recipe);
    return sendSuccess(res, { recipe }, 201);
  } catch (err) {
    next(err);
  }
}
