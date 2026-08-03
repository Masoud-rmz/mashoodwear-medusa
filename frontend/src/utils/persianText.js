const PERSIAN_SCRIPT_PATTERN =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detect Persian/Arabic script in user-facing text from admin CMS.
 * @param {string | null | undefined} text
 * @returns {boolean}
 */
export function containsPersian(text) {
  if (!text || typeof text !== "string") {
    return false;
  }
  return PERSIAN_SCRIPT_PATTERN.test(text);
}

/**
 * Build class list for Persian typography when text contains Persian script.
 * @param {string | null | undefined} text
 * @param {"body" | "heading"} variant
 * @returns {string | undefined}
 */
export function persianTextClass(text, variant = "body") {
  if (!containsPersian(text)) {
    return undefined;
  }
  return variant === "heading" ? "text-persian-heading" : "text-persian";
}
