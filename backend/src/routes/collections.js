import { Router } from "express";
import { getCollectionBySlug, listActiveCollections } from "../services/collectionService.js";

const router = Router();

router.get("/", async (_request, response) => {
  try {
    const result = await listActiveCollections();
    response.json({ ok: true, ...result });
  } catch (error) {
    console.error("GET /api/collections failed:", error);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/:slug", async (request, response) => {
  try {
    const collection = await getCollectionBySlug(request.params.slug);
    if (!collection) {
      response.status(404).json({ ok: false, error: "not_found" });
      return;
    }
    response.json({ ok: true, collection });
  } catch (error) {
    console.error("GET /api/collections/:slug failed:", error);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;
