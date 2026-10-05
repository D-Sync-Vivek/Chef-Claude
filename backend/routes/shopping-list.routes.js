import { Router } from "express";
import * as controller from "../controllers/shopping-list.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware.js";
import { idParamsSchema, limitQuerySchema } from "../schemas/common.schema.js";
import { createShoppingListSchema, itemParamsSchema, updateItemSchema } from "../schemas/shopping-list.schema.js";

const router = Router();
router.use(requireAuth);

router.get("/", validateQuery(limitQuerySchema), controller.listLists);
router.post("/", validateBody(createShoppingListSchema), controller.createList);
router.get("/:id", validateParams(idParamsSchema), controller.getList);
router.patch("/:id/items/:itemId", validateParams(itemParamsSchema), validateBody(updateItemSchema), controller.updateItem);
router.delete("/:id", validateParams(idParamsSchema), controller.deleteList);

export default router;
