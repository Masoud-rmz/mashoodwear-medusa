/**
 * Order payment confirmation helpers for card-to-card manual approval flow.
 * purpose --- tracking code only after admin captures/confirms payment ---
 */

/**
 * Whether Medusa payment_status means admin has confirmed payment.
 * @param {string | null | undefined} paymentStatus
 * @returns {boolean}
 */
export function isOrderPaymentConfirmed(paymentStatus) {
  const normalized = String(paymentStatus || "")
    .trim()
    .toLowerCase();
  return (
    normalized === "captured" ||
    normalized === "paid" ||
    normalized === "partially_captured" ||
    normalized === "partially_refunded" ||
    normalized === "refunded"
  );
}

/**
 * Buyer-facing Persian label for payment status.
 * @param {string | null | undefined} paymentStatus
 * @returns {string}
 */
export function labelForPaymentStatus(paymentStatus) {
  const normalized = String(paymentStatus || "")
    .trim()
    .toLowerCase();
  if (isOrderPaymentConfirmed(paymentStatus)) {
    return "پرداخت تأیید شد";
  }
  if (
    normalized === "not_paid" ||
    normalized === "awaiting" ||
    normalized === "pending" ||
    normalized === "authorized" ||
    normalized === "requires_action" ||
    !normalized
  ) {
    return "در انتظار تأیید رسید";
  }
  if (normalized === "canceled" || normalized === "cancelled") {
    return "لغو شده";
  }
  return paymentStatus || "نامشخص";
}
