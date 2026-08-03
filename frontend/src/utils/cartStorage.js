const CART_STORAGE_KEY = "mashood_cart";
const LEGACY_CART_STORAGE_KEY = "mashoodwear-cart";

/** @typedef {import('../types').CartLineItem} CartLineItem */

/**
 * Migrate legacy cart key once.
 */
function migrateLegacyCart() {
  try {
    const legacy = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (legacy && !localStorage.getItem(CART_STORAGE_KEY)) {
      localStorage.setItem(CART_STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Notify listeners in the same tab.
 */
export function notifyCartChanged() {
  window.dispatchEvent(new CustomEvent("mashood-cart-changed"));
}

/**
 * Read cart lines from localStorage.
 * @returns {CartLineItem[]}
 */
export function readCart() {
  migrateLegacyCart();
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist cart lines to localStorage.
 * @param {CartLineItem[]} items
 */
export function writeCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    notifyCartChanged();
  } catch {
    // Private browsing or quota — cart works for current session only
  }
}

/**
 * Match cart line by product and variant.
 * @param {CartLineItem} line
 * @param {CartLineItem} item
 */
function isSameLine(line, item) {
  return (
    line.productId === item.productId &&
    line.selectedSize === item.selectedSize &&
    line.selectedColor === item.selectedColor
  );
}

/**
 * Cap quantity to variant stock when known.
 * @param {number} quantity
 * @param {number | undefined} variantStock
 * @returns {{ quantity: number, capped: boolean }}
 */
export function capQuantityToStock(quantity, variantStock) {
  if (variantStock === undefined || variantStock === null) {
    return { quantity: Math.max(1, quantity), capped: false };
  }
  const cappedQty = Math.min(Math.max(1, quantity), Math.max(0, variantStock));
  return { quantity: cappedQty, capped: cappedQty < quantity };
}

/**
 * Add or increment a cart line for the selected variant.
 * @param {CartLineItem} item
 * @returns {CartLineItem[]}
 */
export function addCartLine(item) {
  const cart = readCart();
  const existing = cart.find((line) => isSameLine(line, item));

  if (existing) {
    const { quantity } = capQuantityToStock(
      existing.quantity + item.quantity,
      item.variantStock ?? existing.variantStock
    );
    existing.quantity = quantity;
    if (item.variantStock !== undefined) {
      existing.variantStock = item.variantStock;
    }
  } else {
    const { quantity } = capQuantityToStock(item.quantity, item.variantStock);
    cart.push({ ...item, quantity });
  }

  writeCart(cart);
  return cart;
}

/**
 * Update line quantity; returns capped flag.
 * @param {number} productId
 * @param {string} selectedSize
 * @param {string} selectedColor
 * @param {number} quantity
 * @returns {{ cart: CartLineItem[], capped: boolean }}
 */
export function updateLineQuantity(productId, selectedSize, selectedColor, quantity) {
  const cart = readCart();
  const line = cart.find(
    (item) =>
      item.productId === productId &&
      item.selectedSize === selectedSize &&
      item.selectedColor === selectedColor
  );

  if (!line) {
    return { cart, capped: false };
  }

  if (quantity <= 0) {
    const next = cart.filter((item) => item !== line);
    writeCart(next);
    return { cart: next, capped: false };
  }

  const { quantity: cappedQty, capped } = capQuantityToStock(quantity, line.variantStock);
  line.quantity = cappedQty;
  writeCart(cart);
  return { cart, capped };
}

/**
 * Remove one cart line.
 * @param {number} productId
 * @param {string} selectedSize
 * @param {string} selectedColor
 * @returns {CartLineItem[]}
 */
export function removeLine(productId, selectedSize, selectedColor) {
  const cart = readCart().filter(
    (item) =>
      !(
        item.productId === productId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
      )
  );
  writeCart(cart);
  return cart;
}

/**
 * Total item count for header badge.
 * @returns {number}
 */
export function getCartCount() {
  return readCart().reduce((sum, line) => sum + line.quantity, 0);
}

/**
 * Grand total from line prices.
 * @param {CartLineItem[]} items
 * @returns {number}
 */
export function calculateCartTotal(items) {
  return items.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

/**
 * Whether checkout should be enabled.
 * @param {CartLineItem[]} items
 * @returns {boolean}
 */
export function isCheckoutEnabled(items) {
  return items.length > 0;
}
