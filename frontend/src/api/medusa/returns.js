/**
 * Store returns adapter (Medusa POST /store/returns).
 * purpose --- allow buyer return requests without Admin rebuild ---
 */

import { medusaSdk } from "./client.js";
import { getCustomerToken } from "./customerAuth.js";
import { mapReturnErrorMessage } from "./returnsHelpers.js";

export { mapReturnErrorMessage } from "./returnsHelpers.js";

/**
 * List return shipping options for an order's cart context when available.
 * @param {{ cartId?: string | null }} [options]
 * @returns {Promise<{ ok: boolean, options: Array<{ id: string, name: string }>, message?: string }>}
 */
export async function listReturnShippingOptions(options = {}) {
  const token = getCustomerToken();
  if (!token) {
    return { ok: false, options: [], message: "وارد حساب نشده‌اید." };
  }

  try {
    /** @type {Record<string, unknown>} */
    const query = { is_return: true };
    if (options.cartId) {
      query.cart_id = options.cartId;
    }

    const response = await medusaSdk.client.fetch(`/store/shipping-options`, {
      method: "GET",
      query,
      headers: { Authorization: `Bearer ${token}` },
    });

    const raw = Array.isArray(response?.shipping_options)
      ? response.shipping_options
      : [];

    return {
      ok: true,
      options: raw.map((option) => ({
        id: String(option?.id || ""),
        name: String(option?.name || "Return shipping"),
      })).filter((option) => option.id),
    };
  } catch (error) {
    return {
      ok: false,
      options: [],
      message: mapReturnErrorMessage(error),
    };
  }
}

/**
 * Create a return request for selected order items.
 * @param {{
 *   orderId: string,
 *   items: Array<{ id: string, quantity: number, reason_id?: string }>,
 *   returnShippingOptionId: string,
 *   locationId?: string
 * }} payload
 */
export async function createReturnRequest(payload) {
  const token = getCustomerToken();
  if (!token) {
    return { ok: false, message: "وارد حساب نشده‌اید." };
  }

  const orderId = String(payload.orderId || "");
  const returnShippingOptionId = String(payload.returnShippingOptionId || "");
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!orderId || !returnShippingOptionId || items.length === 0) {
    return {
      ok: false,
      message: "اقلام و روش ارسال مرجوعی الزامی است.",
    };
  }

  try {
    /** @type {Record<string, unknown>} */
    const body = {
      order_id: orderId,
      items: items.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity) || 0,
        ...(item.reason_id ? { reason_id: item.reason_id } : {}),
      })),
      return_shipping: {
        option_id: returnShippingOptionId,
      },
    };
    if (payload.locationId) {
      body.location_id = payload.locationId;
    }

    const response = await medusaSdk.client.fetch(`/store/returns`, {
      method: "POST",
      body,
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      ok: true,
      return: response?.return || response,
    };
  } catch (error) {
    return {
      ok: false,
      message: mapReturnErrorMessage(error),
    };
  }
}
