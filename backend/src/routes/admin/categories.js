import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from "../../services/categoryAdminService.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireRouteId } from "../../utils/parseRouteId.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_request, response) => {
    const items = await listAdminCategories();
    response.json({ ok: true, items });
  })
);

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const result = await createCategory(request.body ?? {});
    if (!result.ok) {
      response.status(result.status).json(result);
      return;
    }
    response.status(201).json(result);
  })
);

router.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const id = requireRouteId(response, request.params.id);
    if (id === null) {
      return;
    }
    const result = await updateCategory(id, request.body ?? {});
    if (!result.ok) {
      response.status(result.status).json(result);
      return;
    }
    response.json(result);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const id = requireRouteId(response, request.params.id);
    if (id === null) {
      return;
    }
    const result = await deleteCategory(id);
    if (!result.ok) {
      response.status(result.status).json(result);
      return;
    }
    response.json(result);
  })
);

export default router;
