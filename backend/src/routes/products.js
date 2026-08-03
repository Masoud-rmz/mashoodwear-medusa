import { Router } from "express";
import {
  getProductBySlug,
  listProducts,
  listSuggestedProducts,
} from "../services/productService.js";

const router = Router();

router.get("/", async (request, response) => {
  try {
    const featured =
      request.query.featured === "true" || request.query.featured === "1";

    const minPrice = request.query.minPrice
      ? Number(request.query.minPrice)
      : null;
    const maxPrice = request.query.maxPrice
      ? Number(request.query.maxPrice)
      : null;

    const result = await listProducts({
      featured,
      category: request.query.category || null,
      size: request.query.size || null,
      color: request.query.color || null,
      minPrice: Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
      search: request.query.search || null,
      collection: request.query.collection || null,
      page: request.query.page ? Number(request.query.page) : 1,
      limit: request.query.limit ? Number(request.query.limit) : 12,
    });

    response.json({ ok: true, ...result });
  } catch (error) {
    console.error("GET /api/products failed:", error.message);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/:slug/related", async (request, response) => {
  try {
    const limit = request.query.limit ? Number(request.query.limit) : 4;
    const result = await listSuggestedProducts(request.params.slug, limit);

    if (!result) {
      response.status(404).json({ ok: false, error: "not_found" });
      return;
    }

    response.json({ ok: true, items: result.items });
  } catch (error) {
    console.error("GET /api/products/:slug/related failed:", error.message);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/:slug", async (request, response) => {
  try {
    const product = await getProductBySlug(request.params.slug);

    if (!product) {
      response.status(404).json({ ok: false, error: "not_found" });
      return;
    }

    response.json({ ok: true, product });
  } catch (error) {
    console.error("GET /api/products/:slug failed:", error.message);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;
