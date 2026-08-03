/**
 * Pure mappers for customer account UI.
 * purpose --- keep account list mapping free of SDK/network imports for unit tests ---
 */
import {
  isOrderPaymentConfirmed,
  labelForPaymentStatus,
} from "../../utils/orderPaymentStatus.js";

/**
 * Map a Medusa order into a compact account-list row.
 * @param {object} order
 */
export function mapOrderToAccountRow(order) {
  const paymentStatus = order.payment_status || null;
  return {
    id: order.id,
    displayId: order.display_id ?? order.id,
    status: order.status || "pending",
    paymentStatus,
    paymentConfirmed: isOrderPaymentConfirmed(paymentStatus),
    paymentLabel: labelForPaymentStatus(paymentStatus),
    createdAt: order.created_at || null,
    total: Number(order.total ?? order.summary?.total ?? 0),
    currencyCode: (order.currency_code || "irt").toUpperCase(),
    itemCount: Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      : 0,
  };
}

/**
 * Map a Medusa order into a detail view for /account/orders/:id.
 * @param {object} order
 */
export function mapOrderToDetail(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const paymentStatus = order?.payment_status || null;
  return {
    id: String(order?.id || ""),
    displayId: order?.display_id ?? order?.id,
    status: order?.status || "pending",
    fulfillmentStatus: order?.fulfillment_status || null,
    paymentStatus,
    paymentConfirmed: isOrderPaymentConfirmed(paymentStatus),
    paymentLabel: labelForPaymentStatus(paymentStatus),
    createdAt: order?.created_at || null,
    email: order?.email || "",
    currencyCode: String(order?.currency_code || "irt").toUpperCase(),
    itemSubtotal: Number(order?.item_subtotal ?? order?.subtotal ?? 0) || 0,
    shippingTotal: Number(order?.shipping_total ?? 0) || 0,
    taxTotal: Number(order?.tax_total ?? 0) || 0,
    discountTotal: Number(order?.discount_total ?? 0) || 0,
    giftCardTotal: Number(order?.gift_card_total ?? 0) || 0,
    total: Number(order?.total ?? order?.summary?.total ?? 0) || 0,
    shippingAddress: order?.shipping_address || null,
    items: items.map((item) => ({
      id: String(item?.id || ""),
      title: String(item?.title || item?.product_title || "Item"),
      quantity: Number(item?.quantity) || 0,
      unitPrice: Number(item?.unit_price ?? item?.subtotal ?? 0) || 0,
      variantId: item?.variant_id || null,
      detail: item?.detail || null,
      returnableQuantity: Math.max(
        0,
        (Number(item?.quantity) || 0) -
          (Number(item?.detail?.return_requested_quantity) || 0) -
          (Number(item?.detail?.return_received_quantity) || 0)
      ),
    })),
  };
}

/**
 * Normalize a Medusa customer address for list/cards.
 * @param {object} address
 */
export function mapCustomerAddressRow(address) {
  return {
    id: String(address?.id || ""),
    addressName: String(address?.address_name || "").trim(),
    firstName: String(address?.first_name || "").trim(),
    lastName: String(address?.last_name || "").trim(),
    phone: String(address?.phone || "").trim(),
    province: String(address?.province || "").trim(),
    city: String(address?.city || "").trim(),
    address1: String(address?.address_1 || "").trim(),
    postalCode: String(address?.postal_code || "").trim(),
    countryCode: String(address?.country_code || "ir").toLowerCase(),
    isDefaultShipping: Boolean(address?.is_default_shipping),
    isDefaultBilling: Boolean(address?.is_default_billing),
  };
}

/**
 * Map a saved customer address into Iran checkout / account form fields.
 * @param {object} address
 * @returns {Record<string, string>}
 */
export function mapCustomerAddressToFormValues(address) {
  return {
    first_name: String(address?.first_name || "").trim(),
    last_name: String(address?.last_name || "").trim(),
    phone: String(address?.phone || "").trim(),
    email: "",
    province: String(address?.province || "").trim(),
    city: String(address?.city || "").trim(),
    address_1: String(address?.address_1 || "").trim(),
    postal_code: String(address?.postal_code || "").trim(),
  };
}

/**
 * One-line label for saved-address pickers.
 * @param {ReturnType<typeof mapCustomerAddressRow>} row
 */
export function formatCustomerAddressLabel(row) {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  const place = [row.city, row.province].filter(Boolean).join("، ");
  const parts = [row.addressName || name, place, row.postalCode].filter(Boolean);
  return parts.join(" — ") || row.id;
}
