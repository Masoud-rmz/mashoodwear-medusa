/**
 * Resolve CSS color for Medusa option values (any casing / common Persian names).
 * purpose --- swatches must match Admin values like blue/red/White, not only hardcoded PRODUCT_COLORS ---
 */

/** @type {Record<string, string>} */
const COLOR_HEX_BY_KEY = {
  black: "#000000",
  سفید: "#ffffff",
  white: "#ffffff",
  gray: "#6b6b6b",
  grey: "#6b6b6b",
  cream: "#f5f0e1",
  brown: "#5c4033",
  blue: "#1e3a5f",
  navy: "#1e3a5f",
  red: "#c62828",
  green: "#2e7d32",
  "pastel-green": "#b4d4b4",
  "tiffany-green": "#0abab5",
  olive: "#556b2f",
  beige: "#d8c3a5",
  pink: "#e91e8c",
  purple: "#6a1b9a",
  yellow: "#f9a825",
  orange: "#ef6c00",
  مشکی: "#000000",
  سیاه: "#000000",
  کرم: "#f5f0e1",
  آبی: "#1e3a5f",
  قرمز: "#c62828",
  سبز: "#2e7d32",
  خاکستری: "#6b6b6b",
  قهوه‌ای: "#5c4033",
  قهوهای: "#5c4033",
};

/**
 * Normalize color name for lookup / CSS class.
 * @param {string} colorName
 * @returns {string}
 */
export function colorNameToSlug(colorName) {
  return String(colorName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/**
 * Hex (or CSS color) for a Medusa color option value.
 * @param {string} colorName
 * @returns {string | null}
 */
export function resolveColorHex(colorName) {
  const raw = String(colorName || "").trim();
  if (!raw) {
    return null;
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    return raw;
  }
  const key = colorNameToSlug(raw);
  if (COLOR_HEX_BY_KEY[key]) {
    return COLOR_HEX_BY_KEY[key];
  }
  // Try without dashes (e.g. pastelgreen)
  const compact = key.replace(/-/g, "");
  for (const [name, hex] of Object.entries(COLOR_HEX_BY_KEY)) {
    if (name.replace(/-/g, "") === compact) {
      return hex;
    }
  }
  return null;
}

/**
 * Prefer a sensible default when Size-only variants exist under a multi-color product.
 * @param {string[]} productColors
 * @returns {string | null}
 */
export function resolveSizeOnlyFallbackColor(productColors) {
  if (!Array.isArray(productColors) || productColors.length === 0) {
    return null;
  }
  if (productColors.length === 1) {
    return productColors[0];
  }
  const white = productColors.find((color) =>
    /^(white|سفید)$/i.test(String(color).trim())
  );
  if (white) {
    return white;
  }
  const black = productColors.find((color) =>
    /^(black|مشکی|سیاه)$/i.test(String(color).trim())
  );
  if (black) {
    return black;
  }
  return productColors[productColors.length - 1];
}
