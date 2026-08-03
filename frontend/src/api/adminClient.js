import { clearAdminToken, getAdminToken } from "../utils/adminAuth";

/**
 * Authenticated fetch for admin API.
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function adminFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAdminToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));

  if (response.status === 403 && body.error === "session_expired") {
    clearAdminToken();
    throw new Error("session_expired");
  }

  if (!response.ok) {
    const message =
      body.message ||
      (body.error === "not_found" ? "Item not found" : null) ||
      `Request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

export function adminLogin(username, password) {
  return adminFetch("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function adminGetDashboard() {
  return adminFetch("/api/admin/products/dashboard");
}

export function adminGetProducts(params = {}) {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return adminFetch(`/api/admin/products${query ? `?${query}` : ""}`);
}

export function adminGetProduct(id) {
  return adminFetch(`/api/admin/products/${id}`);
}

export function adminSaveProduct(id, formData) {
  return adminFetch(id ? `/api/admin/products/${id}` : "/api/admin/products", {
    method: id ? "PUT" : "POST",
    body: formData,
  });
}

export function adminDeleteProduct(id) {
  const productId = Number(id);
  return adminFetch(`/api/admin/products/${productId}`, { method: "DELETE" });
}

export function adminGetCategories() {
  return adminFetch("/api/admin/categories");
}

export function adminCreateCategory(payload) {
  return adminFetch("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminUpdateCategory(id, payload) {
  return adminFetch(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adminDeleteCategory(id) {
  return adminFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export function adminGetCollections() {
  return adminFetch("/api/admin/collections");
}

export function adminGetCollection(id) {
  return adminFetch(`/api/admin/collections/${id}`);
}

export function adminSaveCollection(id, formData) {
  return adminFetch(id ? `/api/admin/collections/${id}` : "/api/admin/collections", {
    method: id ? "PUT" : "POST",
    body: formData,
  });
}

export function adminDeleteCollection(id) {
  return adminFetch(`/api/admin/collections/${id}`, { method: "DELETE" });
}

export function adminGetPages() {
  return adminFetch("/api/admin/pages");
}

export function adminUpdatePage(slug, payload) {
  return adminFetch(`/api/admin/pages/${slug}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adminGetLookbookImages() {
  return adminFetch("/api/admin/lookbook-images");
}

export function adminUploadLookbookImage(formData) {
  return adminFetch("/api/admin/lookbook-images", { method: "POST", body: formData });
}

export function adminDeleteLookbookImage(id) {
  return adminFetch(`/api/admin/lookbook-images/${id}`, { method: "DELETE" });
}

export function adminGetSettings() {
  return adminFetch("/api/admin/settings");
}

export function adminUpdateSettings(formData) {
  return adminFetch("/api/admin/settings", { method: "PUT", body: formData });
}

export function adminChangePassword(currentPassword, newPassword) {
  return adminFetch("/api/admin/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function getPublicPage(slug) {
  return fetch(`/api/pages/${slug}`).then((response) => response.json());
}

export function getPublicLookbook() {
  return fetch("/api/lookbook").then((response) => response.json());
}
