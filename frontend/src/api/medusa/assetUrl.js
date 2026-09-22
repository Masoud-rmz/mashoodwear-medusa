/**
 * Turn Medusa file URLs into addresses the Vite storefront can load.
 * purpose --- Admin often stores /static/... which the browser would request from :5173 ---
 */

const fallbackBackendUrl = "http://localhost:9000";

export const medusaBackendUrl = String(
  import.meta.env?.VITE_MEDUSA_BACKEND_URL || fallbackBackendUrl,
).replace(/\/$/, "");

/**
 * Prefix root-relative Medusa uploads, and rewrite loopback file URLs.
 * purpose --- Admin on the VPS stores http://localhost:9000/static which shoppers cannot open ---
 * @param {string | null | undefined} url
 * @param {string} [backendUrl]
 * @returns {string | null}
 */
export function resolveMedusaAssetUrl(url, backendUrl = medusaBackendUrl) {
  if (typeof url !== "string") {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  const origin = String(backendUrl || fallbackBackendUrl).replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const loopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      if (loopback && parsed.pathname.startsWith("/static/")) {
        return `${origin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  if (/^(data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${origin}${trimmed}`;
  }
  return trimmed;
}
