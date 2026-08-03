/**
 * Persist Medusa cart_id and clear pre-Medusa local carts.
 * purpose --- keep cart identity across reloads without pulling in the JS SDK ---
 */

export const MEDUSA_CART_ID_KEY = "mashood_medusa_cart_id";
export const LEGACY_CART_STORAGE_KEY = "mashood_cart";
export const LEGACY_CART_STORAGE_KEY_ALT = "mashoodwear-cart";

/** @type {boolean} */
let legacyCleared = false;

/**
 * @returns {string | null}
 */
export function getStoredCartId() {
  try {
    return localStorage.getItem(MEDUSA_CART_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * @param {string} cartId
 */
export function setStoredCartId(cartId) {
  try {
    localStorage.setItem(MEDUSA_CART_ID_KEY, cartId);
  } catch {
    // Private browsing — cart id lives in memory only for this session
  }
}

/**
 * Clear persisted Medusa cart id (e.g. after successful order — phase 5).
 */
export function clearStoredCartId() {
  try {
    localStorage.removeItem(MEDUSA_CART_ID_KEY);
  } catch {
    // ignore
  }
}

/**
 * One-time drop of pre-Medusa local carts — cannot map without variant_id.
 * @param {{ force?: boolean }} [options]
 */
export function clearLegacyLocalCarts(options = {}) {
  if (legacyCleared && !options.force) {
    return;
  }
  try {
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY_ALT);
  } catch {
    // ignore
  }
  legacyCleared = true;
}

/**
 * Reset one-time flag (tests only).
 */
export function resetLegacyCartClearFlagForTests() {
  legacyCleared = false;
}
