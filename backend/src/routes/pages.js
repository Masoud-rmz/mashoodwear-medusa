import { Router } from "express";
import { getPageBySlug } from "../services/pageService.js";

const router = Router();

router.get("/:slug", async (request, response) => {
  const page = await getPageBySlug(request.params.slug);
  if (!page) {
    response.status(404).json({ ok: false, error: "not_found" });
    return;
  }
  response.json({ ok: true, page });
});

export default router;
