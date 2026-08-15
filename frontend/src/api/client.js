/**
 * Thin fetch wrapper: CMS stays on Express; catalog routes to Medusa when enabled.
 */
import { isMedusaCommerceEnabled } from "./medusa/client.js";
import * as medusaCatalog from "./medusa/catalog.js";

/**
 * @template T
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
export async function fetchJson(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * @returns {Promise<import('../types').HomeSettings>}
 */
export function getHomeSettings() {
  return fetchJson("/api/settings/home");
}

/**
 * @returns {Promise<import('../types').CheckoutSettings>}
 */
export function getCheckoutSettings() {
  return fetchJson("/api/settings/checkout");
}

/**
 * @param {{
 *   featured?: boolean,
 *   limit?: number,
 *   page?: number,
 *   category?: string,
 *   size?: string,
 *   color?: string,
 *   minPrice?: number,
 *   maxPrice?: number,
 *   search?: string,
 *   collection?: string,
 *   signal?: AbortSignal
 * }} params
 * @returns {Promise<import('../types').ProductsResponse>}
 */
export function getProducts(params = {}) {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getProducts(params);
  }

  const { signal, ...queryParams } = params;
  const search = new URLSearchParams();
  if (queryParams.featured) {
    search.set("featured", "true");
  }
  if (queryParams.limit) {
    search.set("limit", String(queryParams.limit));
  }
  if (queryParams.page) {
    search.set("page", String(queryParams.page));
  }
  if (queryParams.category) {
    search.set("category", queryParams.category);
  }
  if (queryParams.size) {
    search.set("size", queryParams.size);
  }
  if (queryParams.color) {
    search.set("color", queryParams.color);
  }
  if (queryParams.minPrice !== undefined && queryParams.minPrice !== null) {
    search.set("minPrice", String(queryParams.minPrice));
  }
  if (queryParams.maxPrice !== undefined && queryParams.maxPrice !== null) {
    search.set("maxPrice", String(queryParams.maxPrice));
  }
  if (queryParams.search) {
    search.set("search", queryParams.search);
  }
  if (queryParams.collection) {
    search.set("collection", queryParams.collection);
  }
  const query = search.toString();
  return fetchJson(`/api/products${query ? `?${query}` : ""}`, { signal });
}

/**
 * @returns {Promise<import('../types').CategoriesResponse>}
 */
export function getCategories() {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getCategories();
  }
  return fetchJson("/api/categories");
}

/**
 * @param {string} slug
 */
export async function getCategoryBySlug(slug) {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getCategoryBySlug(slug);
  }
  return { ok: false, notFound: true };
}

/**
 * Size/color facet values for the products filter panel.
 * @returns {Promise<{ ok: true, sizes: string[], colors: Array<{ name: string, slug: string }> }>}
 */
export async function getCatalogFacets() {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getCatalogFacets();
  }
  const { PRODUCT_SIZES, PRODUCT_COLORS } = await import("../constants/filters.js");
  return {
    ok: true,
    sizes: [...PRODUCT_SIZES],
    colors: PRODUCT_COLORS.map((color) => ({ name: color.name, slug: color.slug })),
  };
}

/**
 * @param {string} slug
 * @returns {Promise<import('../types').ProductDetailResponse | import('../types').ProductNotFoundResponse>}
 */
export async function getProductBySlug(slug) {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getProductBySlug(slug);
  }

  const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
  const body = await response.json();

  if (response.status === 404) {
    return { ok: false, notFound: true };
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return body;
}

/**
 * Suggested products for a product detail page.
 * @param {string} slug
 * @param {{ limit?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<import('../types').RelatedProductsResponse | import('../types').ProductNotFoundResponse>}
 */
export async function getRelatedProducts(slug, options = {}) {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getRelatedProducts(slug, options);
  }

  const { limit = 4, signal } = options;
  const search = new URLSearchParams();
  if (limit) {
    search.set("limit", String(limit));
  }
  const query = search.toString();
  const response = await fetch(
    `/api/products/${encodeURIComponent(slug)}/related${query ? `?${query}` : ""}`,
    { signal }
  );
  const body = await response.json();

  if (response.status === 404) {
    return { ok: false, notFound: true };
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return body;
}

/**
 * Brand collections — Medusa only (no Express CMS fallback).
 * purpose --- collections SoT is Medusa Admin; dual CMS source removed ---
 * @returns {Promise<import('../types').CollectionsResponse>}
 */
export async function getCollections() {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getCollections();
  }
  return fetchJson("/api/collections");
}

/**
 * @param {string} slug
 * @returns {Promise<import('../types').CollectionDetailResponse | import('../types').CollectionNotFoundResponse>}
 */
export async function getCollectionBySlug(slug) {
  if (isMedusaCommerceEnabled()) {
    return medusaCatalog.getCollectionBySlug(slug);
  }

  const response = await fetch(`/api/collections/${encodeURIComponent(slug)}`);
  const body = await response.json();

  if (response.status === 404) {
    return { ok: false, notFound: true };
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return body;
}
