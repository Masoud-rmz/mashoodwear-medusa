/**
 * Format Toman price with suffix for cart and checkout.
 * @param {number | string} amount
 * @returns {string}
 */
export function formatPriceWithToman(amount) {
  const formatted = formatPrice(amount);
  return formatted ? `${formatted} Toman` : "";
}

/**
 * Format Toman price: Western commas, no currency symbol.
 * @param {number | string} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return "";
  }
  return Math.round(value).toLocaleString("en-US");
}
