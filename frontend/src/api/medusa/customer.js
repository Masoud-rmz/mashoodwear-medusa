/**
 * Authenticated customer Store API helpers.
 * purpose --- profile + orders + saved Iran addresses for /account using customer JWT ---
 */

import { medusaBackendUrl, medusaPublishableKey, medusaSdk, medusaStoreFetch } from "./client.js"
import { getCustomerToken, clearCustomerToken } from "./customerAuth.js"
import { buildIranAddressPayload } from "./checkoutHelpers.js"
import { mapCustomerAddressRow } from "./accountMappers.js"

export {
  mapOrderToAccountRow,
  mapOrderToDetail,
  mapCustomerAddressRow,
  mapCustomerAddressToFormValues,
  formatCustomerAddressLabel,
} from "./accountMappers.js"

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
async function customerFetch(path, options = {}) {
  const token = getCustomerToken()
  if (!token) {
    return { ok: false, status: 401, body: { error: "not_authenticated" } }
  }

  const response = await fetch(`${medusaBackendUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": medusaPublishableKey,
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  let body = {}
  const text = await response.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text }
    }
  }

  if (response.status === 401) {
    clearCustomerToken()
  }

  return { ok: response.ok, status: response.status, body }
}

/**
 * @returns {Promise<{ ok: boolean, customer?: object, message?: string }>}
 */
export async function getCustomerMe() {
  const result = await customerFetch("/store/customers/me")
  if (!result.ok) {
    return {
      ok: false,
      message: "ورود منقضی شده است. دوباره وارد شوید.",
    }
  }
  return { ok: true, customer: result.body.customer }
}

/**
 * @param {{ first_name?: string, last_name?: string }} payload
 */
export async function updateCustomerMe(payload) {
  const result = await customerFetch("/store/customers/me", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (!result.ok) {
    return {
      ok: false,
      message: "به‌روزرسانی پروفایل ناموفق بود.",
    }
  }
  return { ok: true, customer: result.body.customer }
}

/**
 * List customer orders (newest first).
 * @param {{ limit?: number }} [options]
 */
export async function listCustomerOrders(options = {}) {
  const limit = options.limit || 20
  const token = getCustomerToken()
  if (!token) {
    return { ok: false, orders: [], message: "وارد حساب نشده‌اید." }
  }

  try {
    const response = await medusaSdk.client.fetch(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        order: "-created_at",
        fields:
          "id,display_id,status,payment_status,created_at,email,total,currency_code,*items",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return {
      ok: true,
      orders: Array.isArray(response?.orders) ? response.orders : [],
    }
  } catch (error) {
    return {
      ok: false,
      orders: [],
      message:
        error instanceof Error
          ? error.message
          : "خواندن سفارش‌ها ناموفق بود.",
    }
  }
}

/**
 * Retrieve one customer order by id.
 * @param {string} orderId
 */
export async function getCustomerOrderById(orderId) {
  const token = getCustomerToken()
  if (!token) {
    return { ok: false, order: null, message: "وارد حساب نشده‌اید." }
  }
  if (!orderId) {
    return { ok: false, order: null, message: "شناسه سفارش نامعتبر است." }
  }

  try {
    const response = await medusaSdk.client.fetch(
      `/store/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        query: {
          fields:
            "id,display_id,status,fulfillment_status,payment_status,created_at,email,currency_code,item_subtotal,subtotal,shipping_total,tax_total,discount_total,gift_card_total,total,*items,*items.detail,*shipping_address",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const order = response?.order || null
    if (!order) {
      return { ok: false, order: null, message: "سفارش پیدا نشد." }
    }
    return { ok: true, order }
  } catch (error) {
    return {
      ok: false,
      order: null,
      message:
        error instanceof Error ? error.message : "خواندن سفارش ناموفق بود.",
    }
  }
}

/**
 * @param {object} body
 * @returns {{ error?: string, message?: string, fields?: Record<string, string> }}
 */
function readAddressError(body) {
  return {
    error: body?.error ? String(body.error) : undefined,
    message: body?.message
      ? String(body.message)
      : "ذخیره آدرس ناموفق بود.",
    fields:
      body?.fields && typeof body.fields === "object"
        ? /** @type {Record<string, string>} */ (body.fields)
        : undefined,
  }
}

/**
 * Client-side Iran Pack validate before create/update (middleware also enforces).
 * @param {import('./checkoutHelpers.js').IranCheckoutAddress} address
 */
async function validateBeforeSave(address) {
  try {
    const { ok, body } = await medusaStoreFetch("/store/iran/validate-address", {
      method: "POST",
      body: JSON.stringify(address),
    })
    if (ok && body?.ok !== false) {
      return { ok: true }
    }
    return {
      ok: false,
      error: String(body?.error || "iran_address_invalid"),
      message: String(body?.message || "Iran address validation failed."),
      fields:
        body?.fields && typeof body.fields === "object"
          ? /** @type {Record<string, string>} */ (body.fields)
          : undefined,
    }
  } catch {
    return {
      ok: false,
      error: "network_error",
      message: "Network error while validating address.",
    }
  }
}

/**
 * List saved customer addresses (visible in Medusa Admin → Customers).
 * @param {{ limit?: number }} [options]
 */
export async function listCustomerAddresses(options = {}) {
  const limit = options.limit || 50
  const result = await customerFetch(
    `/store/customers/me/addresses?limit=${limit}`
  )
  if (!result.ok) {
    return {
      ok: false,
      addresses: [],
      message: "خواندن آدرس‌های ذخیره‌شده ناموفق بود.",
    }
  }

  const raw = Array.isArray(result.body?.addresses)
    ? result.body.addresses
    : []
  return {
    ok: true,
    addresses: raw.map(mapCustomerAddressRow).filter((row) => row.id),
  }
}

/**
 * Create a customer address after Iran Pack validation.
 * @param {Partial<import('./checkoutHelpers.js').IranCheckoutAddress> & {
 *   address_name?: string,
 *   is_default_shipping?: boolean,
 *   is_default_billing?: boolean,
 * }} form
 */
export async function createCustomerAddress(form) {
  const address = buildIranAddressPayload(form)
  const validation = await validateBeforeSave(address)
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
      message: validation.message,
      fields: validation.fields,
    }
  }

  const result = await customerFetch("/store/customers/me/addresses", {
    method: "POST",
    body: JSON.stringify({
      ...address,
      address_name: String(form.address_name || "").trim() || undefined,
      is_default_shipping: Boolean(form.is_default_shipping),
      is_default_billing: Boolean(
        form.is_default_billing ?? form.is_default_shipping
      ),
    }),
  })

  if (!result.ok) {
    return { ok: false, ...readAddressError(result.body) }
  }

  const nested = Array.isArray(result.body?.customer?.addresses)
    ? result.body.customer.addresses
    : []
  return {
    ok: true,
    customer: result.body?.customer,
    addresses: nested.map(mapCustomerAddressRow).filter((row) => row.id),
  }
}

/**
 * Update an existing customer address.
 * @param {string} addressId
 * @param {Partial<import('./checkoutHelpers.js').IranCheckoutAddress> & {
 *   address_name?: string,
 *   is_default_shipping?: boolean,
 *   is_default_billing?: boolean,
 * }} form
 */
export async function updateCustomerAddress(addressId, form) {
  if (!addressId) {
    return { ok: false, message: "شناسه آدرس نامعتبر است." }
  }

  const address = buildIranAddressPayload(form)
  const validation = await validateBeforeSave(address)
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
      message: validation.message,
      fields: validation.fields,
    }
  }

  const result = await customerFetch(
    `/store/customers/me/addresses/${encodeURIComponent(addressId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        ...address,
        address_name: String(form.address_name || "").trim() || undefined,
        is_default_shipping: Boolean(form.is_default_shipping),
        is_default_billing: Boolean(
          form.is_default_billing ?? form.is_default_shipping
        ),
      }),
    }
  )

  if (!result.ok) {
    return { ok: false, ...readAddressError(result.body) }
  }

  const nested = Array.isArray(result.body?.customer?.addresses)
    ? result.body.customer.addresses
    : []
  return {
    ok: true,
    customer: result.body?.customer,
    addresses: nested.map(mapCustomerAddressRow).filter((row) => row.id),
  }
}

/**
 * Delete a saved customer address.
 * @param {string} addressId
 */
export async function deleteCustomerAddress(addressId) {
  if (!addressId) {
    return { ok: false, message: "شناسه آدرس نامعتبر است." }
  }

  const result = await customerFetch(
    `/store/customers/me/addresses/${encodeURIComponent(addressId)}`,
    { method: "DELETE" }
  )

  if (!result.ok) {
    return {
      ok: false,
      message: "حذف آدرس ناموفق بود.",
    }
  }

  return { ok: true }
}
