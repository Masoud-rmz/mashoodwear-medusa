/**
 * Turn Medusa file URLs into addresses the Vite storefront can load.
 * purpose --- Admin often stores /static/... which the browser would request from :5173 ---
 */

const fallbackBackendUrl = "http://localhost:9000";

export const medusaBackendUrl = String(
  import.meta.env?.VITE_MEDUSA_BACKEND_URL || fallbackBackendUrl,
).replace(/\/$/, "");

/**
 * Prefix root-relative Medusa uploads with the backend origin.
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function resolveMedusaAssetUrl(url) {
  if (typeof url !== "string") {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${medusaBackendUrl}${trimmed}`;
  }
  return trimmed;
}
