import { Router } from "express";
import { getPublicLookbook } from "../services/lookbookService.js";

const router = Router();

router.get("/", async (_request, response) => {
  const lookbook = await getPublicLookbook();
  response.json({ ok: true, ...lookbook });
});

export default router;
