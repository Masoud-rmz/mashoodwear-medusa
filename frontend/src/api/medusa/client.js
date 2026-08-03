/**
 * Medusa JS SDK singleton for the Mashhoodwear Vite storefront.
 * purpose --- central Store API client with publishable key ---
 * Backend target: Iran Pack store at my-medusa-store (not vanilla Medusa Cloud).
 */
import Medusa from "@medusajs/js-sdk";
import { getCustomerToken } from "./customerAuth.js";

export const medusaBackendUrl =
  import.meta.env.VITE_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
  "http://localhost:9000";

export const medusaPublishableKey =
  import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "";

/** @type {import('@medusajs/js-sdk').Medusa} */
export const medusaSdk = new Medusa({
  baseUrl: medusaBackendUrl,
  debug: import.meta.env.DEV,
  publishableKey: medusaPublishableKey,
});

export const medusaAdminUrl =
  import.meta.env.VITE_MEDUSA_ADMIN_URL || `${medusaBackendUrl}/app`;

export const medusaDefaultCountry = (
  import.meta.env.VITE_MEDUSA_DEFAULT_COUNTRY || "ir"
).toLowerCase();

/**
 * Whether the storefront should read catalog/cart from Medusa.
 * @returns {boolean}
 */
export function isMedusaCommerceEnabled() {
  const provider = (
    import.meta.env.VITE_COMMERCE_PROVIDER || "medusa"
  ).toLowerCase();
  return provider === "medusa" && Boolean(medusaPublishableKey);
}

/**
 * @returns {string}
 */
export function getConfiguredRegionId() {
  return import.meta.env.VITE_MEDUSA_REGION_ID || "";
}

/**
 * Authorization header for authenticated customer Store calls.
 * @returns {Record<string, string>}
 */
export function getCustomerAuthHeaders() {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch Iran Pack / Store routes that are not wrapped by the JS SDK.
 * @param {string} path e.g. `/store/iran/validate-address`
 * @param {RequestInit} [options]
 * @returns {Promise<{ ok: boolean, status: number, body: Record<string, unknown> }>}
 */
export async function medusaStoreFetch(path, options = {}) {
  const response = await fetch(`${medusaBackendUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": medusaPublishableKey,
      ...getCustomerAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  let body = {};
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}
