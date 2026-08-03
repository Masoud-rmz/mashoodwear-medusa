import { Router } from "express";
import { checkDatabaseConnection } from "../db/pool.js";

const router = Router();

/**
 * Health check — reports API and database connectivity for monitoring.
 */
router.get("/", async (_request, response) => {
  try {
    const connected = await checkDatabaseConnection();
    if (!connected) {
      return response.status(503).json({ ok: false, db: "disconnected" });
    }
    return response.json({ ok: true, db: "connected" });
  } catch {
    return response.status(503).json({ ok: false, db: "disconnected" });
  }
});

export default router;
