import { Router } from "express";
import { listCategories } from "../services/categoryService.js";

const router = Router();

router.get("/", async (_request, response) => {
  try {
    const items = await listCategories();
    response.json({ ok: true, items });
  } catch (error) {
    console.error("GET /api/categories failed:", error.message);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;
