/**
 * Pure checkout helpers (no SDK) for Iran Pack address/shipping UI.
 * purpose --- keep unit tests free of Vite/Medusa runtime imports ---
 */

/**
 * @typedef {object} IranCheckoutAddress
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} address_1
 * @property {string} [address_2]
 * @property {string} city
 * @property {string} province
 * @property {string} postal_code
 * @property {string} phone
 * @property {string} [country_code]
 */

/**
 * Build Store API address payload (always country ir for this storefront).
 * @param {Partial<IranCheckoutAddress> & Record<string, string>} form
 * @returns {IranCheckoutAddress}
 */
export function buildIranAddressPayload(form) {
  return {
    first_name: String(form.first_name || "").trim(),
    last_name: String(form.last_name || "").trim(),
    address_1: String(form.address_1 || "").trim(),
    address_2: String(form.address_2 || "").trim() || undefined,
    city: String(form.city || "").trim(),
    province: String(form.province || "").trim(),
    postal_code: String(form.postal_code || "").trim().replace(/\D/g, ""),
    phone: String(form.phone || "").trim(),
    country_code: "ir",
  };
}

/**
 * @param {object} option
 * @returns {{ id: string, name: string, amount: number }}
 */
export function mapShippingOption(option) {
  const calculated = option?.calculated_price?.calculated_amount;
  const amount =
    calculated !== undefined && calculated !== null
      ? Number(calculated) || 0
      : Number(option?.amount) || 0;

  return {
    id: String(option?.id || ""),
    name: String(option?.name || "Shipping"),
    amount,
  };
}

/**
 * Read money totals from a Medusa cart (IRT display units).
 * @param {object | null | undefined} cart
 * @returns {{
 *   itemTotal: number,
 *   shippingTotal: number,
 *   taxTotal: number,
 *   discountTotal: number,
 *   giftCardTotal: number,
 *   grandTotal: number
 * }}
 */
export function extractCartTotals(cart) {
  const itemTotal =
    Number(cart?.item_subtotal ?? cart?.subtotal ?? 0) ||
    (Array.isArray(cart?.items)
      ? cart.items.reduce(
          (sum, item) =>
            sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
          0
        )
      : 0);

  const shippingTotal =
    Number(cart?.shipping_subtotal ?? cart?.shipping_total ?? 0) || 0;
  const taxTotal = Math.max(0, Number(cart?.tax_total) || 0);
  const discountTotal = Math.max(0, Number(cart?.discount_total) || 0);
  const giftCardTotal = Math.max(0, Number(cart?.gift_card_total) || 0);

  const grandTotal =
    Number(cart?.total ?? cart?.original_total ?? 0) ||
    itemTotal - discountTotal - giftCardTotal + shippingTotal + taxTotal;

  return {
    itemTotal,
    shippingTotal,
    taxTotal,
    discountTotal,
    giftCardTotal,
    grandTotal,
  };
}
