import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changeAdminPassword, loginAdmin } from "../../services/authService.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "rate_limited", message: "Too many login attempts" },
});

router.post("/login", loginLimiter, async (request, response) => {
  const { username, password } = request.body ?? {};
  if (!username || !password) {
    response.status(400).json({ ok: false, error: "validation", message: "Username and password required" });
    return;
  }

  const result = await loginAdmin(String(username), String(password));
  if (!result.ok) {
    response.status(401).json({
      ok: false,
      error: "invalid_credentials",
      message: "Wrong username or password",
    });
    return;
  }

  response.json({ ok: true, token: result.token });
});

router.post("/change-password", requireAuth, async (request, response) => {
  const { currentPassword, newPassword } = request.body ?? {};
  const result = await changeAdminPassword(
    request.admin.adminId,
    String(currentPassword || ""),
    String(newPassword || "")
  );

  if (!result.ok) {
    response.status(result.status).json({ ok: false, message: result.error });
    return;
  }

  response.json({ ok: true });
});

export default router;
