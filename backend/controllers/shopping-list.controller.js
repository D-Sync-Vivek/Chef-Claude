import * as shoppingLists from "../services/shopping-list.service.js";
import { sendSuccess } from "../utils/api-response.js";

const handler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

export const createList = handler(async (req, res) =>
  sendSuccess(res, { shoppingList: await shoppingLists.createShoppingListFromPlan(req.user.id, req.body) }, 201));

export const listLists = handler(async (req, res) =>
  sendSuccess(res, { shoppingLists: await shoppingLists.listShoppingLists(req.user.id, req.validated.query) }));

export const getList = handler(async (req, res) =>
  sendSuccess(res, { shoppingList: await shoppingLists.getShoppingList(req.user.id, req.validated.params.id) }));

export const updateItem = handler(async (req, res) => {
  const { id, itemId } = req.validated.params;
  return sendSuccess(res, { item: await shoppingLists.setItemChecked(req.user.id, id, itemId, req.body.checked) });
});

export const deleteList = handler(async (req, res) => {
  await shoppingLists.deleteShoppingList(req.user.id, req.validated.params.id);
  return sendSuccess(res, { message: "Shopping list deleted" });
});
