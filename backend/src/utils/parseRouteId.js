/**
 * Parse a route :id param into a positive integer.
 * Invalid values (undefined, NaN, zero) return null — prevents SQL crashes.
 * @param {string | undefined} rawId
 * @returns {number | null}
 */
export function parseRouteId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

/**
 * Send 400 when route id is invalid; returns parsed id or null after writing response.
 * @param {import("express").Response} response
 * @param {string | undefined} rawId
 * @returns {number | null}
 */
export function requireRouteId(response, rawId) {
  const id = parseRouteId(rawId);
  if (id === null) {
    response.status(400).json({ ok: false, error: "invalid_id", message: "Invalid resource id" });
    return null;
  }
  return id;
}
