import { Router } from "express";
import {
  createLookbookImage,
  deleteLookbookImage,
  listLookbookImages,
  updateLookbookImage,
} from "../../services/lookbookService.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createImageUpload, uploadPublicPath } from "../../middleware/upload.js";
import { requireRouteId } from "../../utils/parseRouteId.js";

const router = Router();
const upload = createImageUpload("lookbook");

router.get(
  "/",
  asyncHandler(async (_request, response) => {
    const items = await listLookbookImages();
    response.json({ ok: true, items });
  })
);

router.post(
  "/",
  upload.single("image"),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      response.status(400).json({ ok: false, message: "Image is required" });
      return;
    }
    const filePath = uploadPublicPath("lookbook", request.file.filename);
    const result = await createLookbookImage(filePath, request.body?.caption);
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
    const result = await updateLookbookImage(id, request.body ?? {});
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
    const result = await deleteLookbookImage(id);
    if (!result.ok) {
      response.status(result.status).json(result);
      return;
    }
    response.json(result);
  })
);

export default router;
