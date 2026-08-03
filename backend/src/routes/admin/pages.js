import { Router } from "express";
import { listAdminPages, updatePage } from "../../services/pageService.js";

const router = Router();

router.get("/", async (_request, response) => {
  const items = await listAdminPages();
  response.json({ ok: true, items });
});

router.put("/:slug", async (request, response) => {
  const result = await updatePage(request.params.slug, request.body ?? {});
  if (!result.ok) {
    response.status(result.status).json(result);
    return;
  }
  response.json(result);
});

export default router;
