/**
 * Checkout adapters for Iran Pack C-03 / C-04 (address + shipping).
 * purpose --- validate Iran address, save on cart, list/set shipping options ---
 */
import { medusaSdk, medusaStoreFetch } from "./client.js";
import {
  ensureCart,
  getCachedCart,
  replaceCartCache,
} from "./cart.js";
import {
  buildIranAddressPayload,
  extractCartTotals,
  mapShippingOption,
} from "./checkoutHelpers.js";

export {
  buildIranAddressPayload,
  extractCartTotals,
  mapShippingOption,
} from "./checkoutHelpers.js";

/** Cart fields needed for checkout totals and shipping display. */
const CHECKOUT_CART_FIELDS =
  "*items,*items.variant,*items.product,*items.variant.options,*items.variant.options.option,*shipping_address,*billing_address,*shipping_methods,*promotions";

/**
 * Call Iran Pack standalone validate-address before updating the cart.
 * @param {import('./checkoutHelpers.js').IranCheckoutAddress} address
 * @returns {Promise<{ ok: true } | { ok: false, error: string, message: string, fields?: Record<string, string>, status?: number }>}
 */
export async function validateIranCheckoutAddress(address) {
  try {
    const { ok, status, body } = await medusaStoreFetch(
      "/store/iran/validate-address",
      {
        method: "POST",
        body: JSON.stringify(address),
      }
    );

    if (ok && body?.ok !== false) {
      return { ok: true };
    }

    return {
      ok: false,
      error: String(body?.error || "iran_address_invalid"),
      message: String(body?.message || "Iran address validation failed."),
      fields:
        body?.fields && typeof body.fields === "object"
          ? /** @type {Record<string, string>} */ (body.fields)
          : undefined,
      status,
    };
  } catch {
    return {
      ok: false,
      error: "network_error",
      message: "Network error while validating address.",
    };
  }
}

/**
 * Save Iran shipping (+ billing) address on the Medusa cart.
 * Logged-in customers must pass a real email; guest synthetic emails are not used for purchase.
 * @param {{ address: import('./checkoutHelpers.js').IranCheckoutAddress, email?: string }} params
 * @returns {Promise<object>} updated cart
 */
export async function updateCartIranAddress({ address, email }) {
  const cart = await ensureCart();
  const resolvedEmail = String(email || "").trim();
  if (!resolvedEmail) {
    const err = new Error("login_required");
    err.code = "login_required";
    throw err;
  }

  const { cart: updated } = await medusaSdk.store.cart.update(
    cart.id,
    {
      email: resolvedEmail,
      shipping_address: address,
      billing_address: address,
    },
    { fields: CHECKOUT_CART_FIELDS }
  );

  replaceCartCache(updated);
  return updated;
}

/**
 * List shipping options for the current cart (after address is set).
 * @returns {Promise<Array<{ id: string, name: string, amount: number }>>}
 */
export async function listCartShippingOptions() {
  const cart = await ensureCart();
  const { shipping_options } = await medusaSdk.store.fulfillment.listCartOptions({
    cart_id: cart.id,
  });

  return (shipping_options || [])
    .map(mapShippingOption)
    .filter((option) => option.id);
}

/**
 * Attach a shipping option to the cart.
 * @param {string} optionId
 * @returns {Promise<object>} updated cart
 */
export async function setCartShippingOption(optionId) {
  if (!optionId) {
    throw new Error("shipping option id is required");
  }

  const cart = await ensureCart();
  const { cart: updated } = await medusaSdk.store.cart.addShippingMethod(
    cart.id,
    { option_id: optionId },
    { fields: CHECKOUT_CART_FIELDS }
  );

  replaceCartCache(updated);
  return updated;
}

/**
 * @returns {object | null}
 */
export function getCheckoutCartSnapshot() {
  return getCachedCart();
}
