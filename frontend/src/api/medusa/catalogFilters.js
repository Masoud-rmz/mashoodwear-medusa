/**
 * Pure catalog filter helpers (no Medusa SDK).
 * purpose --- unit-testable filtering shared by catalog facade ---
 */

const FEATURED_TAG_VALUES = new Set(["featured", "new-arrivals", "new", "newarrival"]);

/**
 * Whether product has a featured-style tag.
 * @param {object} product
 * @returns {boolean}
 */
export function productHasFeaturedTag(product) {
  return (product?.tags || []).some((tag) =>
    FEATURED_TAG_VALUES.has(String(tag?.value || "").toLowerCase())
  );
}

/**
 * Apply size / color / price filters that Store API does not expose first-class.
 * TODO: replace with Medusa option-value filters when available server-side.
 * @param {Array<{
 *   price: number,
 *   variants: Array<{ size: string, color: string }>
 * }>} items
 * @param {{
 *   size?: string,
 *   color?: string,
 *   minPrice?: number,
 *   maxPrice?: number
 * }} params
 * @returns {typeof items}
 */
export function applyClientSideProductFilters(items, params) {
  let filtered = items;

  if (params.size) {
    const size = params.size.toLowerCase();
    filtered = filtered.filter((item) =>
      item.variants.some((variant) => variant.size.toLowerCase() === size)
    );
  }

  if (params.color) {
    const color = params.color.toLowerCase();
    filtered = filtered.filter((item) =>
      item.variants.some((variant) => variant.color.toLowerCase() === color)
    );
  }

  if (params.minPrice !== undefined && params.minPrice !== null) {
    const minimum = Number(params.minPrice);
    filtered = filtered.filter((item) => item.price >= minimum);
  }

  if (params.maxPrice !== undefined && params.maxPrice !== null) {
    const maximum = Number(params.maxPrice);
    filtered = filtered.filter((item) => item.price <= maximum);
  }

  return filtered;
}
