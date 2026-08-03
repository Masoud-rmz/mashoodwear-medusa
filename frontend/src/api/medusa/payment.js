/**

 * Iran Pack payment adapters (C-05…C-07).

 * purpose --- payment collection/session + complete cart; never verify in React ---

 */

import { medusaSdk } from "./client.js";
import {
  clearStoredCartId,
  ensureCart,
  getCachedCart,
  getStoredCartId,
  replaceCartCache,
  retrieveCartById,
} from "./cart.js";
import { extractCartTotals } from "./checkoutHelpers.js";
import {
  IRAN_BANK_PROVIDER_ID,
  CARD_TO_CARD_PROVIDER_ID,
  buildIranBankReturnUrl,
  extractIranBankSessionData,
  extractOrderDisplay,
  findIranBankPaymentSession,
  findPaymentSessionByProvider,
  storeLastOrderSummary,
} from "./paymentHelpers.js";
export {
  IRAN_BANK_PROVIDER_ID,
  CARD_TO_CARD_PROVIDER_ID,
  buildIranBankReturnUrl,
  extractIranBankSessionData,
  extractOrderDisplay,
  findIranBankPaymentSession,
  findPaymentSessionByProvider,
  mapGatewayResultToUiStatus,
  readLastOrderSummary,
  storeLastOrderSummary,
} from "./paymentHelpers.js";
/** Cart fields including payment collection for checkout payment step. */

const PAYMENT_CART_FIELDS =
  "*items,*items.variant,*items.product,*items.variant.options,*items.variant.options.option,*shipping_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions,*promotions";
/**

 * Retrieve current cart with payment_collection expanded.

 * @param {string} [cartId]

 * @returns {Promise<object | null>}

 */

export async function retrieveCartForPayment(cartId) {
  const id = cartId || getStoredCartId();
  if (!id) {
    return null;
  }
  try {
    const { cart } = await medusaSdk.store.cart.retrieve(id, {
      fields: PAYMENT_CART_FIELDS,
    });
    if (cart) {
      replaceCartCache(cart);
    }
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

 * Create / refresh payment collection + Iran bank payment session.

 * SDK creates the collection when cart has none (C-05).

 * @param {{ returnOrigin?: string }} [options]

 * @returns {Promise<{

 *   cart: object,

 *   paymentCollection: object | null,

 *   paymentSession: object | null,

 *   redirectUrl: string | null,

 *   amountIrr: number,

 *   ref: string | null,

 *   totals: { itemTotal: number, shippingTotal: number, grandTotal: number },

 *   error: string | null

 * }>}

 */

export async function initiateIranBankPayment(options = {}) {
  const cart = await ensureCart();
  const freshCart =
    (await retrieveCartForPayment(cart.id)) || (await ensureCart());
  if (!freshCart?.shipping_methods?.length) {
    const err = new Error("shipping_required");
    err.code = "shipping_required";
    throw err;
  }
  const origin =
    options.returnOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const returnUrl = buildIranBankReturnUrl(origin, { cartId: freshCart.id });
  const { payment_collection } =
    await medusaSdk.store.payment.initiatePaymentSession(freshCart, {
      provider_id: IRAN_BANK_PROVIDER_ID,
      data: {
        return_url: returnUrl,
      },
    });
  const cartAfter = (await retrieveCartForPayment(freshCart.id)) || {
    ...freshCart,
    payment_collection,
  };
  replaceCartCache(cartAfter);
  const session = findIranBankPaymentSession(
    payment_collection || cartAfter.payment_collection
  );
  const sessionData = extractIranBankSessionData(session);
  return {
    cart: cartAfter,
    paymentCollection: payment_collection || cartAfter.payment_collection || null,
    paymentSession: session,
    redirectUrl: sessionData.redirectUrl,
    amountIrr: sessionData.amountIrr,
    ref: sessionData.ref,
    totals: extractCartTotals(cartAfter),
    error: sessionData.error,
  };
}

/**
 * Initiate card-to-card session and complete the cart (offline transfer).
 * Merchant verifies receipt via Instagram/Telegram.
 * @returns {Promise<{
 *   ok: boolean,
 *   status: import('./paymentHelpers.js').OrderPaymentUiStatus,
 *   order: object | null,
 *   orderDisplay: ReturnType<typeof extractOrderDisplay> | null,
 *   totals: { itemTotal: number, shippingTotal: number, grandTotal: number },
 *   error?: string
 * }>}
 */
export async function completeCardToCardCheckout() {
  const cart = await ensureCart();
  const freshCart =
    (await retrieveCartForPayment(cart.id)) || (await ensureCart());
  if (!freshCart?.shipping_methods?.length) {
    const err = new Error("shipping_required");
    err.code = "shipping_required";
    throw err;
  }

  await medusaSdk.store.payment.initiatePaymentSession(freshCart, {
    provider_id: CARD_TO_CARD_PROVIDER_ID,
    data: {
      method: "card_to_card",
    },
  });

  const completed = await completeCheckoutCart(freshCart.id);
  const totals = extractCartTotals(freshCart);

  if (completed.ok && completed.orderDisplay) {
    storeLastOrderSummary({
      orderId: completed.orderDisplay.orderId,
      displayId: completed.orderDisplay.displayId,
      status: "awaiting_receipt",
    });
    return {
      ...completed,
      status: "awaiting_receipt",
      totals,
    };
  }

  return {
    ...completed,
    totals,
  };
}

/**
 * Redirect browser to Iran bank gateway / stub pay URL.
 * @param {string} redirectUrl
 */

export function redirectToIranBankGateway(redirectUrl) {
  if (!redirectUrl) {
    throw new Error("redirect_unavailable");
  }
  window.location.assign(redirectUrl);
}
/**

 * Complete cart after successful gateway return (verify stays on Medusa).

 * @param {string} [cartId]

 * @returns {Promise<{

 *   ok: boolean,

 *   status: import('./paymentHelpers.js').OrderPaymentUiStatus,

 *   order: object | null,

 *   orderDisplay: ReturnType<typeof extractOrderDisplay> | null,

 *   error?: string,

 *   cart?: object | null

 * }>}

 */

export async function completeCheckoutCart(cartId) {
  const id = cartId || getStoredCartId();
  if (!id) {
    return {
      ok: false,
      status: "pending_payment",
      order: null,
      orderDisplay: null,
      error: "cart_missing",
    };
  }
  try {
    const result = await medusaSdk.store.cart.complete(id);
    if (result?.type === "order" && result.order) {
      clearStoredCartId();
      replaceCartCache(null);
      const orderDisplay = extractOrderDisplay(result.order);
      storeLastOrderSummary({
        orderId: orderDisplay.orderId,
        displayId: orderDisplay.displayId,
        status: "paid",
      });
      return {
        ok: true,
        status: "paid",
        order: result.order,
        orderDisplay,
      };
    }
    // Cart still open — payment may still be pending authorization
    if (result?.cart) {
      replaceCartCache(result.cart);
    }
    return {
      ok: false,
      status: "pending_payment",
      order: null,
      orderDisplay: null,
      error: "complete_failed",
      cart: result?.cart || getCachedCart(),
    };
  } catch (error) {
    const message = String(error?.message || "");
    const code =
      message.includes("config") || message.includes("incomplete")
        ? "config_incomplete"
        : "complete_failed";
    return {
      ok: false,
      status: code === "config_incomplete" ? "config_incomplete" : "pending_payment",
      order: null,
      orderDisplay: null,
      error: code,
    };
  }
}
/**

 * Retrieve a store order by id when guest access allows (post-complete).

 * @param {string} orderId

 * @returns {Promise<object | null>}

 */

export async function retrieveStoreOrder(orderId) {
  if (!orderId) {
    return null;
  }
  try {
    const { order } = await medusaSdk.store.order.retrieve(orderId);
    return order || null;
  } catch {
    return null;
  }
}
/**

 * Snapshot totals from cached checkout cart.

 * @returns {{ itemTotal: number, shippingTotal: number, grandTotal: number }}

 */

export function getPaymentCartTotals() {
  return extractCartTotals(getCachedCart());
}
