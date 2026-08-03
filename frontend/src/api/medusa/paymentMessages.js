/**

 * Map payment / order result statuses and errors to Persian copy.

 * purpose --- stable system codes stay English; buyer sees readable Persian ---

 */



/** @type {Record<string, string>} */
const STATUS_MESSAGES = {
  awaiting_receipt:
    "سفارش ثبت شد. حالا مبلغ را کارت‌به‌کارت واریز کنید و رسید را بفرستید؛ پس از تأیید ادمین، کد پیگیری در حساب شما نمایش داده می‌شود.",
  paid: "پرداخت تأیید شد. کد پیگیری سفارش شما آماده است.",
  failed: "پرداخت ناموفق بود. می‌توانید دوباره تلاش کنید.",
  pending_payment: "پرداخت هنوز تأیید نشده است. لطفاً چند لحظه صبر کنید یا دوباره بررسی کنید.",
  config_incomplete:
    "درگاه پرداخت آماده نیست. لطفاً بعداً دوباره تلاش کنید یا از پشتیبانی بپرسید.",
  payment_failed: "پرداخت ناموفق بود. می‌توانید دوباره تلاش کنید.",
};



/** @type {Record<string, string>} */

const ERROR_MESSAGES = {

  network_error: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.",

  missing_ref: "شناسه تراکنش پرداخت یافت نشد.",

  not_found: "تراکنش پرداخت پیدا نشد.",

  config_incomplete:

    "درگاه پرداخت آماده نیست. تنظیمات Iran Pack را در Medusa بررسی کنید.",

  payment_session_failed: "ایجاد نشست پرداخت ناموفق بود. دوباره تلاش کنید.",

  redirect_unavailable: "آدرس درگاه آماده نیست. نشست پرداخت را دوباره شروع کنید.",

  complete_failed: "ثبت نهایی سفارش پس از پرداخت ناموفق بود. با پشتیبانی تماس بگیرید.",

  cart_missing: "سبد خرید برای تکمیل سفارش پیدا نشد.",

  shipping_required: "قبل از پرداخت باید روش ارسال را انتخاب کنید.",

  bank_gateway_unavailable:
    "درگاه بانکی واقعی هنوز فعال نیست. از کارت‌به‌کارت استفاده کنید.",

};



/**

 * @param {string | undefined} status

 * @returns {string}

 */

export function messageForPaymentStatus(status) {

  if (!status) {

    return STATUS_MESSAGES.pending_payment;

  }

  return STATUS_MESSAGES[status] || STATUS_MESSAGES.pending_payment;

}



/**

 * @param {string | undefined} code

 * @returns {string}

 */

export function messageForPaymentError(code) {

  if (!code) {

    return "خطایی در پرداخت رخ داد. دوباره تلاش کنید.";

  }

  return ERROR_MESSAGES[code] || "خطایی در پرداخت رخ داد. دوباره تلاش کنید.";

}


