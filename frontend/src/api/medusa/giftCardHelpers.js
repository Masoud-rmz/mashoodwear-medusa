/**
 * Gift card error copy for Cart UI.
 * purpose --- Persian messages without exposing Medusa internals ---
 */

/**
 * @param {unknown} error
 * @returns {string}
 */
export function mapGiftCardErrorMessage(error) {
  const message = String(
    error?.message ||
      error?.response?.data?.message ||
      error?.body?.message ||
      ""
  ).toLowerCase();

  if (
    message.includes("not found") ||
    message.includes("invalid") ||
    message.includes("does not exist")
  ) {
    return "کد کارت هدیه معتبر نیست";
  }
  if (message.includes("already") || message.includes("applied")) {
    return "این کارت هدیه قبلاً روی سبد اعمال شده";
  }
  if (message.includes("currency")) {
    return "ارز کارت هدیه با سبد هم‌خوان نیست";
  }
  if (message.includes("balance") || message.includes("insufficient")) {
    return "موجودی کارت هدیه کافی نیست";
  }
  return "اعمال کارت هدیه ممکن نشد — دوباره تلاش کنید";
}

/**
 * @param {object | null | undefined} cart
 * @returns {{ code: string, id: string }[]}
 */
export function mapCartGiftCards(cart) {
  const cards = Array.isArray(cart?.gift_cards) ? cart.gift_cards : [];
  return cards
    .map((card) => ({
      id: String(card?.id || ""),
      code: String(card?.code || "").trim(),
    }))
    .filter((card) => card.code);
}
