/**

 * Pure payment helpers (no SDK) for Iran Pack C-05…C-08.

 * purpose --- keep unit tests free of Vite/Medusa runtime imports ---

 */



/** Iran Pack payment provider id (region Iran). */
export const IRAN_BANK_PROVIDER_ID = "pp_iran-bank_iran";

/** Offline card-to-card payment provider id. */
export const CARD_TO_CARD_PROVIDER_ID = "pp_card-to-card_card-to-card";

/** sessionStorage key for last completed order display. */
export const LAST_ORDER_STORAGE_KEY = "mashood_last_order";

/**
 * @typedef {"paid" | "failed" | "pending_payment" | "config_incomplete" | "awaiting_receipt"} OrderPaymentUiStatus
 */

/**
 * Find payment session by provider id on a payment collection.
 * @param {object | null | undefined} paymentCollection
 * @param {string} providerId
 * @returns {object | null}
 */
export function findPaymentSessionByProvider(paymentCollection, providerId) {
  const sessions = paymentCollection?.payment_sessions;
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return null;
  }
  return sessions.find((session) => session?.provider_id === providerId) || null;
}

/**
 * Find Iran bank session on a payment collection.
 * @param {object | null | undefined} paymentCollection
 * @returns {object | null}
 */
export function findIranBankPaymentSession(paymentCollection) {
  const sessions = paymentCollection?.payment_sessions;
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return null;
  }
  return (
    sessions.find((session) => session?.provider_id === IRAN_BANK_PROVIDER_ID) ||
    sessions[0] ||
    null
  );
}



/**

 * Extract gateway redirect URL and amount from payment session data.

 * @param {object | null | undefined} paymentSession

 * @returns {{ redirectUrl: string | null, amountIrr: number, ref: string | null, error: string | null }}

 */

export function extractIranBankSessionData(paymentSession) {

  const data = paymentSession?.data || {};

  const redirectUrl =

    typeof data.redirect_url === "string" && data.redirect_url

      ? data.redirect_url

      : null;

  const amountIrr = Number(data.amount_irr) || 0;

  const ref = typeof data.ref === "string" && data.ref ? data.ref : null;

  const error =

    typeof data.error === "string" && data.error ? data.error : null;



  return { redirectUrl, amountIrr, ref, error };

}



/**

 * Map stub/gateway query `result` to a stable UI status (before complete).

 * @param {string | null | undefined} gatewayResult

 * @returns {OrderPaymentUiStatus}

 */

export function mapGatewayResultToUiStatus(gatewayResult) {

  const normalized = String(gatewayResult || "")

    .trim()

    .toLowerCase();



  if (normalized === "success" || normalized === "ok" || normalized === "paid") {

    return "pending_payment";

  }

  if (

    normalized === "fail" ||

    normalized === "failed" ||

    normalized === "error" ||

    normalized === "payment_failed"

  ) {

    return "failed";

  }

  if (normalized === "config_incomplete") {

    return "config_incomplete";

  }

  return "pending_payment";

}



/**

 * Build buyer return URL for Iran bank stub/real gateway.

 * @param {string} origin window.location.origin

 * @param {{ cartId?: string | null }} [options]

 * @returns {string}

 */

export function buildIranBankReturnUrl(origin, options = {}) {

  const base = String(origin || "").replace(/\/$/, "");

  const url = new URL(`${base}/order/result`);

  if (options.cartId) {

    url.searchParams.set("cart_id", options.cartId);

  }

  return url.toString();

}



/**

 * Pick display fields from a Store order.

 * @param {object | null | undefined} order

 * @returns {{ orderId: string, displayId: string | number | null, total: number }}

 */

export function extractOrderDisplay(order) {

  return {

    orderId: String(order?.id || ""),

    displayId: order?.display_id ?? null,

    total: Number(order?.total) || 0,

  };

}



/**

 * Persist last order summary for refresh-safe result page.

 * @param {{ orderId: string, displayId?: string | number | null, status: OrderPaymentUiStatus }} summary

 */

export function storeLastOrderSummary(summary) {

  try {

    sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(summary));

  } catch {

    // private browsing

  }

}



/**

 * @returns {{ orderId: string, displayId?: string | number | null, status: OrderPaymentUiStatus } | null}

 */

export function readLastOrderSummary() {

  try {

    const raw = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);

    if (!raw) {

      return null;

    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || !parsed.orderId) {

      return null;

    }

    return parsed;

  } catch {

    return null;

  }

}


