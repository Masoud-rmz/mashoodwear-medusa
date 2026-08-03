/**
 * Map Iran Pack / checkout error codes to Persian buyer-facing messages.
 * purpose --- stable error codes stay English; UI shows readable Persian ---
 */

/** @type {Record<string, string>} */
const FIELD_MESSAGES = {
  iran_address_required: "این فیلد الزامی است.",
  iran_postal_code_invalid: "کد پستی باید دقیقاً ۱۰ رقم باشد.",
  iran_phone_invalid:
    "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷ یا +۹۸۹۱۲۱۲۳۴۵۶۷).",
  iran_province_invalid: "استان انتخاب‌شده معتبر نیست.",
};

/** @type {Record<string, string>} */
const TOP_LEVEL_MESSAGES = {
  iran_address_invalid: "آدرس ایران ناقص یا نادرست است. فیلدها را بررسی کنید.",
  iran_address_required: "لطفاً همه فیلدهای الزامی آدرس را پر کنید.",
  network_error: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.",
  shipping_unavailable: "روش ارسال برای این آدرس در دسترس نیست.",
  shipping_required: "لطفاً یک روش ارسال انتخاب کنید.",
};

/**
 * @param {string | undefined} code
 * @returns {string}
 */
export function messageForIranAddressField(code) {
  if (!code) {
    return "";
  }
  return FIELD_MESSAGES[code] || "مقدار این فیلد معتبر نیست.";
}

/**
 * @param {string | undefined} code
 * @returns {string}
 */
export function messageForCheckoutError(code) {
  if (!code) {
    return "خطایی رخ داد. دوباره تلاش کنید.";
  }
  return TOP_LEVEL_MESSAGES[code] || "خطایی رخ داد. دوباره تلاش کنید.";
}

/**
 * Flatten Iran Pack validate-address `fields` into per-input messages.
 * @param {Record<string, string> | undefined} fields
 * @returns {Record<string, string>}
 */
export function mapIranAddressFieldErrors(fields) {
  /** @type {Record<string, string>} */
  const mapped = {};
  if (!fields || typeof fields !== "object") {
    return mapped;
  }
  for (const [key, code] of Object.entries(fields)) {
    mapped[key] = messageForIranAddressField(code);
  }
  return mapped;
}
