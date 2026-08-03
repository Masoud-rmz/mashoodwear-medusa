import { Router } from "express";
import {
  createCollection,
  deleteCollection,
  getAdminCollection,
  listAdminCollections,
  updateCollection,
} from "../../services/collectionAdminService.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createImageUpload, uploadPublicPath } from "../../middleware/upload.js";
import { parseBooleanField, parseJsonField } from "../../utils/parseForm.js";
import { requireRouteId } from "../../utils/parseRouteId.js";

const router = Router();
const upload = createImageUpload("collections");

router.get(
  "/",
  asyncHandler(async (_request, response) => {
    const items = await listAdminCollections();
    response.json({ ok: true, items });
  })
);

router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const id = requireRouteId(response, request.params.id);
    if (id === null) {
      return;
    }
    const collection = await getAdminCollection(id);
    if (!collection) {
      response.status(404).json({ ok: false, error: "not_found" });
      return;
    }
    response.json({ ok: true, collection });
  })
);

router.post(
  "/",
  upload.single("coverImage"),
  asyncHandler(async (request, response) => {
    const coverPath = request.file
      ? uploadPublicPath("collections", request.file.filename)
      : null;
    const body = request.body ?? {};
    const result = await createCollection(
      {
        name: body.name,
        slug: body.slug,
        description: body.description,
        displayOrder: body.displayOrder,
        isActive: parseBooleanField(body.isActive),
        productIds: parseJsonField(body.productIds, []),
      },
      coverPath
    );
    if (!result.ok) {
      response.status(result.status).json(result);
      return;
    }
    response.status(201).json(result);
  })
);

router.put(
  "/:id",
  upload.single("coverImage"),
  asyncHandler(async (request, response) => {
    const id = requireRouteId(response, request.params.id);
    if (id === null) {
      return;
    }
    const coverPath = request.file
      ? uploadPublicPath("collections", request.file.filename)
      : null;
    const body = request.body ?? {};
    const result = await updateCollection(
      id,
      {
        name: body.name,
        slug: body.slug,
        description: body.description,
        displayOrder: body.displayOrder,
        isActive: body.isActive !== undefined ? parseBooleanField(body.isActive) : undefined,
        productIds: body.productIds !== undefined ? parseJsonField(body.productIds, []) : undefined,
      },
      coverPath
    );
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
    const result = await deleteCollection(id);
    if (!result.ok) {
      response.status(result.status).json(result);
      return;
    }
    response.json(result);
  })
);

export default router;
