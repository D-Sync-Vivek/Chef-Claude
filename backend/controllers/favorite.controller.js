import { addFavorite, listFavoritesForUser, removeFavorite } from "../services/favorite.service.js";
import { sendSuccess } from "../utils/api-response.js";

export async function favoriteRecipe(req, res, next) {
  try {
    const { created } = await addFavorite(req.user.id, req.validated.params.id);
    return sendSuccess(res, { isFavorite: true }, created ? 201 : 200);
  } catch (err) {
    next(err);
  }
}

export async function unfavoriteRecipe(req, res, next) {
  try {
    await removeFavorite(req.user.id, req.validated.params.id);
    return sendSuccess(res, { isFavorite: false });
  } catch (err) {
    next(err);
  }
}

export async function listFavorites(req, res, next) {
  try {
    const { recipes, nextCursor } = await listFavoritesForUser(req.user.id, req.validated.query);
    return sendSuccess(res, { recipes, nextCursor });
  } catch (err) {
    next(err);
  }
}
