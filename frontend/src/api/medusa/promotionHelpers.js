import { mapCartGiftCards } from "./giftCardHelpers.js";

/**
 * Map Medusa cart promotions and money totals for Cart UI.
 * purpose --- surface discount/tax/gift totals without reimplementing Medusa rules ---
 */

/**
 * @param {object | null | undefined} cart
 * @returns {{ code: string, id: string }[]}
 */
export function mapCartPromotions(cart) {
  const promotions = Array.isArray(cart?.promotions) ? cart.promotions : [];
  return promotions
    .map((promo) => ({
      id: String(promo?.id || ""),
      code: String(promo?.code || "").trim(),
    }))
    .filter((promo) => promo.code);
}

/**
 * Cart money fields used by Cart / Checkout footers.
 * @param {object | null | undefined} cart
 * @param {number} [fallbackItemTotal] — sum of line unit×qty when cart totals missing
 * @returns {{
 *   itemSubtotal: number,
 *   discountTotal: number,
 *   shippingTotal: number,
 *   taxTotal: number,
 *   giftCardTotal: number,
 *   total: number,
 *   promotions: { code: string, id: string }[],
 *   giftCards: { code: string, id: string }[]
 * }}
 */
export function mapCartMoneySummary(cart, fallbackItemTotal = 0) {
  const promotions = mapCartPromotions(cart);
  const giftCards = mapCartGiftCards(cart);

  const itemSubtotal =
    Number(cart?.item_subtotal ?? cart?.subtotal ?? fallbackItemTotal) || 0;

  const discountTotal = Math.max(0, Number(cart?.discount_total) || 0);
  const shippingTotal = Math.max(0, Number(cart?.shipping_total) || 0);
  const taxTotal = Math.max(0, Number(cart?.tax_total) || 0);
  const giftCardTotal = Math.max(0, Number(cart?.gift_card_total) || 0);

  const total =
    cart?.total !== undefined && cart?.total !== null
      ? Math.max(0, Number(cart.total) || 0)
      : Math.max(
          0,
          itemSubtotal - discountTotal - giftCardTotal + shippingTotal + taxTotal
        );

  return {
    itemSubtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    giftCardTotal,
    total,
    promotions,
    giftCards,
  };
}

/**
 * Human-readable promo apply error (Medusa Store API).
 * @param {unknown} error
 * @returns {string}
 */
export function mapPromotionErrorMessage(error) {
  const message = String(
    error?.message ||
      error?.response?.data?.message ||
      error?.body?.message ||
      ""
  ).toLowerCase();

  if (
    message.includes("not found") ||
    message.includes("invalid") ||
    message.includes("does not exist") ||
    message.includes("expired")
  ) {
    return "کد تخفیف معتبر نیست یا منقضی شده";
  }

  if (message.includes("already") || message.includes("applied")) {
    return "این کد قبلاً روی سبد اعمال شده";
  }

  return "اعمال کد تخفیف ممکن نشد — دوباره تلاش کنید";
}
