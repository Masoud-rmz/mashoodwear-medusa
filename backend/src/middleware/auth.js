import { verifyAdminToken, extractBearerToken } from "../utils/jwt.js";

/**
 * Require valid admin JWT on protected routes.
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 */
export function requireAuth(request, response, next) {
  const token = extractBearerToken(request);

  if (!token) {
    response.status(403).json({ ok: false, error: "forbidden", message: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAdminToken(token);
    request.admin = payload;
    next();
  } catch {
    response.status(403).json({
      ok: false,
      error: "session_expired",
      message: "Session expired — please log in again",
    });
  }
}
