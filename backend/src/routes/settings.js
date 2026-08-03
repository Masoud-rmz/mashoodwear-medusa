import { Router } from "express";
import { getCheckoutSettings, getHomeSettings } from "../services/settingsService.js";

const router = Router();

router.get("/home", async (_request, response) => {
  try {
    const data = await getHomeSettings();
    response.json(data);
  } catch (error) {
    console.error("GET /api/settings/home failed:", error.message);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/checkout", async (_request, response) => {
  try {
    const data = await getCheckoutSettings();
    response.json(data);
  } catch (error) {
    console.error("GET /api/settings/checkout failed:", error.message);
    response.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;
