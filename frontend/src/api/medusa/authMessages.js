/**
 * Persian auth error fallbacks (mirror of Medusa Iran Pack messages).
 */

export const AUTH_ERROR_MESSAGES = {
  phone_invalid: "شماره موبایل معتبر نیست.",
  phone_required: "شماره موبایل الزامی است.",
  otp_required: "کد تأیید الزامی است.",
  otp_invalid: "کد تأیید نادرست است.",
  otp_expired: "کد تأیید منقضی شده است. دوباره ارسال کنید.",
  otp_not_found: "کد تأییدی برای این شماره یافت نشد. ابتدا درخواست کد دهید.",
  otp_send_failed: "ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.",
  password_required: "رمز عبور الزامی است.",
  password_too_short: "رمز عبور باید حداقل ۶ کاراکتر باشد.",
  name_required: "نام الزامی است.",
  already_registered: "این شماره قبلاً ثبت‌نام کرده است. وارد شوید.",
  not_registered: "حسابی با این شماره یافت نشد. ابتدا ثبت‌نام کنید.",
  invalid_credentials: "شماره یا رمز عبور نادرست است.",
  auth_failed: "ورود ناموفق بود. دوباره تلاش کنید.",
  rate_limit: "تعداد درخواست‌ها زیاد است. کمی صبر کنید.",
  network: "ارتباط با سرور برقرار نشد.",
}

/**
 * @param {string} code
 * @returns {string}
 */
export function messageForAuthError(code) {
  return AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES.auth_failed
}
