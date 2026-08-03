/**
 * Pure return error mapping (no SDK).
 */

/**
 * @param {unknown} error
 * @returns {string}
 */
export function mapReturnErrorMessage(error) {
  const message = String(
    error?.message || error?.response?.data?.message || ""
  ).toLowerCase();

  if (message.includes("shipping") || message.includes("option")) {
    return "روش ارسال مرجوعی در دسترس نیست — با فروشگاه تماس بگیرید.";
  }
  if (message.includes("not eligible") || message.includes("returnable")) {
    return "این سفارش فعلاً قابل مرجوعی نیست.";
  }
  if (message.includes("unauthorized") || message.includes("401")) {
    return "برای مرجوعی باید وارد حساب شوید.";
  }
  return "ثبت درخواست مرجوعی ناموفق بود — دوباره تلاش کنید.";
}
