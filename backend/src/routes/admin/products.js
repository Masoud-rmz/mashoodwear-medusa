import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAdminProduct,
  getDashboardStats,
  listAdminProducts,
  updateProduct,
} from "../../services/productAdminService.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import {
  createImageUpload,
  imageUploadErrorResponse,
  uploadPublicPath,
} from "../../middleware/upload.js";
import { parseBooleanField, parseJsonField } from "../../utils/parseForm.js";
import { requireRouteId } from "../../utils/parseRouteId.js";

const router = Router();
const upload = createImageUpload("products");
const productImagesUpload = upload.array("images", 5);

/**
 * Run multer and return readable 400s instead of generic 500s.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<boolean>} false when response already sent
 */
function handleProductImagesUpload(request, response) {
  return new Promise((resolve) => {
    productImagesUpload(request, response, (error) => {
      if (error) {
        const { status, message } = imageUploadErrorResponse(error);
        response.status(status).json({ ok: false, message });
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

function buildProductInput(body) {
  return {
    name: body.name,
    slug: body.slug,
    description: body.description,
    price: body.price,
    categoryId: body.categoryId,
    sizes: parseJsonField(body.sizes, []),
    colors: parseJsonField(body.colors, []),
    variants: parseJsonField(body.variants, []),
    status: body.status,
    isFeatured: parseBooleanField(body.isFeatured),
    featuredOrder: body.featuredOrder !== undefined && body.featuredOrder !== ""
      ? Number(body.featuredOrder)
      : null,
    collectionIds: parseJsonField(body.collectionIds, []),
    imageOrder: parseJsonField(body.imageOrder, undefined),
    removeImageIds: parseJsonField(body.removeImageIds, []),
  };
}

router.get(
  "/dashboard",
  asyncHandler(async (_request, response) => {
    const stats = await getDashboardStats();
    response.json({ ok: true, stats });
  })
);

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const result = await listAdminProducts({
      search: request.query.search,
      page: request.query.page,
      limit: request.query.limit,
    });
    response.json({ ok: true, ...result });
  })
);

router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const id = requireRouteId(response, request.params.id);
    if (id === null) {
      return;
    }
    const product = await getAdminProduct(id);
    if (!product) {
      response.status(404).json({ ok: false, error: "not_found" });
      return;
    }
    response.json({ ok: true, product });
  })
);

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const uploaded = await handleProductImagesUpload(request, response);
    if (!uploaded) {
      return;
    }
    const imagePaths = (request.files || []).map((file) =>
      uploadPublicPath("products", file.filename)
    );
    const result = await createProduct(buildProductInput(request.body ?? {}), imagePaths);
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
    const uploaded = await handleProductImagesUpload(request, response);
    if (!uploaded) {
      return;
    }
    const newImagePaths = (request.files || []).map((file) =>
      uploadPublicPath("products", file.filename)
    );
    const result = await updateProduct(id, buildProductInput(request.body ?? {}), newImagePaths);
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
    const result = await deleteProduct(id);
    if (!result.ok) {
      response.status(result.status).json(result);
      return;
    }
    response.json(result);
  })
);

export default router;
