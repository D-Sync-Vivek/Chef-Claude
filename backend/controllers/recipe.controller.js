import { generateRecipe } from "../services/recipe.service.js";
import { sendSuccess } from "../utils/api-response.js";

export async function createRecipe(req, res, next) {
  try {
    const recipe = await generateRecipe(req.body.ingredients);
    return sendSuccess(res, { recipe });
  } catch (err) {
    next(err);
  }
}
