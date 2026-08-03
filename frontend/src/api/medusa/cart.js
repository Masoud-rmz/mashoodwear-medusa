/**
 * Medusa Store Cart API adapter for the Vite storefront.
 * purpose --- persist cart_id locally and sync line items via Store Cart API (C-02) ---
 */
import {
  getCustomerAuthHeaders,
  isMedusaCommerceEnabled,
  medusaSdk,
} from "./client.js";
import { getCustomerToken } from "./customerAuth.js";
import { resolveRegionId } from "./catalog.js";
import {
  mapMedusaCartToLineItems,
  sumCartLineQuantities,
} from "./cartMappers.js";
import { mapCartMoneySummary } from "./promotionHelpers.js";
import { mapGiftCardErrorMessage } from "./giftCardHelpers.js";
import {
  clearLegacyLocalCarts,
  clearStoredCartId as clearPersistedCartId,
  getStoredCartId,
  setStoredCartId,
} from "./cartPersistence.js";
import { notifyCartChanged } from "../../utils/cartStorage.js";

export {
  clearLegacyLocalCarts,
  getStoredCartId,
  setStoredCartId,
  MEDUSA_CART_ID_KEY,
  LEGACY_CART_STORAGE_KEY,
  LEGACY_CART_STORAGE_KEY_ALT,
} from "./cartPersistence.js";

export {
  mapCartMoneySummary,
  mapCartPromotions,
  mapPromotionErrorMessage,
} from "./promotionHelpers.js";

export { mapGiftCardErrorMessage } from "./giftCardHelpers.js";

/** Core cart expand fields (safe without Loyalty gift-card link table). */
const CART_FIELDS_CORE =
  "*items,*items.variant,*items.product,*items.variant.options,*items.variant.options.option,*promotions";

/** Full fields including gift cards — needs `npx medusa db:migrate` for Loyalty. */
const CART_FIELDS_WITH_GIFT_CARDS = `${CART_FIELDS_CORE},*gift_cards`;

/** Session flag --- skip *gift_cards after a Loyalty/table failure so cart stays usable. */
let giftCardCartFieldsEnabled = true;

/**
 * @returns {string}
 */
function getCartFields() {
  return giftCardCartFieldsEnabled
    ? CART_FIELDS_WITH_GIFT_CARDS
    : CART_FIELDS_CORE;
}

/**
 * Detect missing Loyalty gift-card relation (pre-migrate / misconfigured DB).
 * Medusa often returns generic 500 without the Postgres text to the browser.
 * @param {unknown} error
 * @returns {boolean}
 */
function isGiftCardRelationError(error) {
  const status = Number(error?.status || error?.response?.status || 0);
  const message = String(
    error?.message ||
      error?.body?.message ||
      error?.response?.data?.message ||
      ""
  ).toLowerCase();
  if (
    message.includes("cart_cart_loyalty_gift_card") ||
    (message.includes("gift_card") && message.includes("does not exist"))
  ) {
    return true;
  }
  // purpose --- browser often only sees generic 500 when Loyalty link table is missing ---
  const looksGeneric =
    !message ||
    message.includes("internal server") ||
    message.includes("unexpected error") ||
    message.includes("request failed");
  return giftCardCartFieldsEnabled && status === 500 && looksGeneric;
}

/**
 * Run a cart SDK call; on Loyalty link-table errors, disable gift_cards fields and retry once.
 * @template T
 * @param {(fields: string) => Promise<T>} operation
 * @returns {Promise<T>}
 */
async function withCartFields(operation) {
  try {
    return await operation(getCartFields());
  } catch (error) {
    if (giftCardCartFieldsEnabled && isGiftCardRelationError(error)) {
      giftCardCartFieldsEnabled = false;
      return operation(CART_FIELDS_CORE);
    }
    throw error;
  }
}

/** @type {object | null} */
let cachedCart = null;

/** @type {import('../../types').CartLineItem[]} */
let cachedLineItems = [];

/**
 * Clear persisted Medusa cart id and in-memory cache.
 */
export function clearStoredCartId() {
  clearPersistedCartId();
  cachedCart = null;
  cachedLineItems = [];
}

/**
 * @returns {import('../../types').CartLineItem[]}
 */
export function getCachedCartLineItems() {
  return cachedLineItems;
}

/**
 * @returns {number}
 */
export function getCachedCartCount() {
  return sumCartLineQuantities(cachedLineItems);
}

/**
 * @returns {object | null}
 */
export function getCachedCart() {
  return cachedCart;
}

/**
 * Money + promotions snapshot for Cart footer.
 * @returns {ReturnType<typeof mapCartMoneySummary>}
 */
export function getCachedCartMoneySummary() {
  const fallback = cachedLineItems.reduce(
    (sum, line) =>
      sum + (Number(line.price) || 0) * (Number(line.quantity) || 0),
    0
  );
  return mapCartMoneySummary(cachedCart, fallback);
}

/**
 * @param {object | null | undefined} cart
 * @returns {import('../../types').CartLineItem[]}
 */
function applyCartCache(cart) {
  cachedCart = cart || null;
  cachedLineItems = mapMedusaCartToLineItems(cart);
  notifyCartChanged();
  return cachedLineItems;
}

/**
 * Replace in-memory cart cache after address/shipping updates (checkout).
 * @param {object | null | undefined} cart
 * @returns {import('../../types').CartLineItem[]}
 */
export function replaceCartCache(cart) {
  return applyCartCache(cart);
}

/**
 * Create a new region cart and persist its id.
 * @returns {Promise<object>}
 */
export async function createCart() {
  const regionId = await resolveRegionId();
  const { cart } = await withCartFields((fields) =>
    medusaSdk.store.cart.create({ region_id: regionId }, { fields })
  );
  if (!cart?.id) {
    throw new Error("Medusa cart create returned no id");
  }
  setStoredCartId(cart.id);
  applyCartCache(cart);
  return cart;
}

/**
 * Retrieve cart by id; returns null when missing/expired.
 * @param {string} cartId
 * @returns {Promise<object | null>}
 */
export async function retrieveCartById(cartId) {
  try {
    const { cart } = await withCartFields((fields) =>
      medusaSdk.store.cart.retrieve(cartId, { fields })
    );
    return cart || null;
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get existing cart or create one. Clears legacy localStorage cart once.
 * @returns {Promise<object>}
 */
export async function ensureCart() {
  if (!isMedusaCommerceEnabled()) {
    throw new Error("Medusa commerce is not enabled");
  }

  clearLegacyLocalCarts();

  const storedId = getStoredCartId();
  if (storedId) {
    const existing = await retrieveCartById(storedId);
    if (existing) {
      applyCartCache(existing);
      return existing;
    }
    clearStoredCartId();
  }

  return createCart();
}

/**
 * Refresh cache from Store API (or empty if no cart yet).
 * @returns {Promise<import('../../types').CartLineItem[]>}
 */
export async function refreshCartLineItems() {
  if (!isMedusaCommerceEnabled()) {
    return [];
  }

  clearLegacyLocalCarts();

  const storedId = getStoredCartId();
  if (!storedId) {
    applyCartCache(null);
    return [];
  }

  const cart = await retrieveCartById(storedId);
  if (!cart) {
    clearStoredCartId();
    applyCartCache(null);
    return [];
  }

  return applyCartCache(cart);
}

/**
 * Add a variant to the Medusa cart.
 * @param {{ variantId: string, quantity?: number }} params
 * @returns {Promise<{ items: import('../../types').CartLineItem[], cart: object }>}
 */
export async function addCartLineItem({ variantId, quantity = 1 }) {
  if (!variantId) {
    throw new Error("variant_id is required to add a Medusa cart line");
  }

  const cart = await ensureCart();
  const { cart: updated } = await withCartFields((fields) =>
    medusaSdk.store.cart.createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity: Math.max(1, Number(quantity) || 1),
      },
      { fields }
    )
  );

  const items = applyCartCache(updated);
  return { items, cart: updated };
}

/**
 * Update line quantity; quantity <= 0 removes the line.
 * @param {string} lineItemId
 * @param {number} quantity
 * @returns {Promise<{ items: import('../../types').CartLineItem[], cart: object | null, capped: boolean }>}
 */
export async function updateCartLineItemQuantity(lineItemId, quantity) {
  if (!lineItemId) {
    throw new Error("lineItemId is required");
  }

  const cart = await ensureCart();
  const nextQty = Number(quantity) || 0;

  if (nextQty <= 0) {
    const { parent } = await withCartFields((fields) =>
      medusaSdk.store.cart.deleteLineItem(cart.id, lineItemId, { fields })
    );
    const items = applyCartCache(parent);
    return { items, cart: parent || null, capped: false };
  }

  try {
    const { cart: updated } = await withCartFields((fields) =>
      medusaSdk.store.cart.updateLineItem(
        cart.id,
        lineItemId,
        { quantity: nextQty },
        { fields }
      )
    );
    const items = applyCartCache(updated);
    return { items, cart: updated, capped: false };
  } catch (error) {
    // Stock / inventory rejection — re-fetch so UI matches server truth
    const refreshed = await retrieveCartById(cart.id);
    const items = applyCartCache(refreshed);
    return { items, cart: refreshed, capped: true, error };
  }
}

/**
 * Remove a line item from the Medusa cart.
 * @param {string} lineItemId
 * @returns {Promise<{ items: import('../../types').CartLineItem[], cart: object | null }>}
 */
export async function removeCartLineItem(lineItemId) {
  if (!lineItemId) {
    throw new Error("lineItemId is required");
  }

  const cart = await ensureCart();
  const { parent } = await withCartFields((fields) =>
    medusaSdk.store.cart.deleteLineItem(cart.id, lineItemId, { fields })
  );
  const items = applyCartCache(parent);
  return { items, cart: parent || null };
}

/**
 * Apply Medusa promotion code(s) to the current cart.
 * @param {string | string[]} promoCode
 * @returns {Promise<{ items: import('../../types').CartLineItem[], cart: object }>}
 */
export async function addCartPromotions(promoCode) {
  const codes = (Array.isArray(promoCode) ? promoCode : [promoCode])
    .map((code) => String(code || "").trim())
    .filter(Boolean);
  if (!codes.length) {
    throw new Error("promo code is required");
  }

  const cart = await ensureCart();
  const { cart: updated } = await withCartFields((fields) =>
    medusaSdk.store.cart.addPromotions(
      cart.id,
      { promo_codes: codes },
      { fields }
    )
  );
  const items = applyCartCache(updated);
  return { items, cart: updated };
}

/**
 * Remove Medusa promotion code(s) from the current cart.
 * @param {string | string[]} promoCode
 * @returns {Promise<{ items: import('../../types').CartLineItem[], cart: object }>}
 */
export async function removeCartPromotions(promoCode) {
  const codes = (Array.isArray(promoCode) ? promoCode : [promoCode])
    .map((code) => String(code || "").trim())
    .filter(Boolean);
  if (!codes.length) {
    throw new Error("promo code is required");
  }

  const cart = await ensureCart();
  const { cart: updated } = await withCartFields((fields) =>
    medusaSdk.store.cart.removePromotions(
      cart.id,
      { promo_codes: codes },
      { fields }
    )
  );
  const items = applyCartCache(updated);
  return { items, cart: updated };
}

/**
 * Apply a gift card code (Loyalty plugin: POST /store/carts/:id/gift-cards).
 * @param {string} giftCode
 * @returns {Promise<{ items: import('../../types').CartLineItem[], cart: object }>}
 */
export async function addCartGiftCard(giftCode) {
  const code = String(giftCode || "").trim();
  if (!code) {
    throw new Error(mapGiftCardErrorMessage({ message: "invalid" }));
  }

  const cart = await ensureCart();
  try {
    const response = await medusaSdk.client.fetch(
      `/store/carts/${encodeURIComponent(cart.id)}/gift-cards`,
      {
        method: "POST",
        body: { code },
        headers: getCustomerAuthHeaders(),
        query: { fields: getCartFields() },
      }
    );
    const updated = response?.cart || response;
    const items = applyCartCache(updated);
    return { items, cart: updated };
  } catch (error) {
    throw new Error(mapGiftCardErrorMessage(error));
  }
}

/**
 * Remove a gift card code from the cart.
 * @param {string} giftCode
 * @returns {Promise<{ items: import('../../types').CartLineItem[], cart: object }>}
 */
export async function removeCartGiftCard(giftCode) {
  const code = String(giftCode || "").trim();
  if (!code) {
    throw new Error(mapGiftCardErrorMessage({ message: "invalid" }));
  }

  const cart = await ensureCart();
  try {
    const response = await medusaSdk.client.fetch(
      `/store/carts/${encodeURIComponent(cart.id)}/gift-cards`,
      {
        method: "DELETE",
        body: { code },
        headers: getCustomerAuthHeaders(),
        query: { fields: getCartFields() },
      }
    );
    const updated = response?.cart || response;
    const items = applyCartCache(updated);
    return { items, cart: updated };
  } catch (error) {
    throw new Error(mapGiftCardErrorMessage(error));
  }
}

/**
 * Attach the guest cart to the logged-in customer (Store transferCart).
 * purpose --- keep checkout continuity after OTP / password login ---
 * @returns {Promise<object | null>}
 */
export async function transferCartToCustomer() {
  if (!isMedusaCommerceEnabled() || !getCustomerToken()) {
    return null;
  }

  const cartId = getStoredCartId();
  if (!cartId) {
    return null;
  }

  try {
    const { cart } = await withCartFields((fields) =>
      medusaSdk.store.cart.transferCart(
        cartId,
        { fields },
        getCustomerAuthHeaders()
      )
    );
    if (cart) {
      applyCartCache(cart);
    }
    return cart || null;
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status === 400 || status === 404 || status === 409) {
      return null;
    }
    throw error;
  }
}
