/**
 * Map Medusa Store API products into Mashhoodwear UI shapes.
 * purpose --- keep existing React pages stable while commerce data comes from Medusa ---
 */
import { resolveSizeOnlyFallbackColor } from "../../utils/colorSwatches.js";
import { resolveMedusaAssetUrl } from "./assetUrl.js";

/** Sentinel when product has no Color option in Medusa. */
export const DEFAULT_COLOR_SENTINEL = "Default";

/**
 * Build stock badge text for product cards.
 * @param {number} totalStock
 * @returns {string}
 */
export function buildStockLabel(totalStock) {
  if (totalStock <= 0) {
    return "Sold out";
  }
  if (totalStock <= 3) {
    return `Only ${totalStock} left`;
  }
  return "In stock";
}

/**
 * Map product option id → title from Medusa product.options.
 * purpose --- Store API often returns variant.options without nested option.title unless expanded ---
 * @param {object | null | undefined} product
 * @returns {Map<string, string>}
 */
export function buildOptionTitleById(product) {
  /** @type {Map<string, string>} */
  const map = new Map();
  const options = Array.isArray(product?.options) ? product.options : [];
  for (const option of options) {
    const id = String(option?.id || "").trim();
    const title = String(option?.title || "").trim();
    if (id && title) {
      map.set(id, title);
    }
  }
  return map;
}

/**
 * Resolve option title from a variant option row + product-level option map.
 * @param {object} optionRow
 * @param {Map<string, string>} [optionTitleById]
 * @returns {string}
 */
export function resolveOptionTitle(optionRow, optionTitleById) {
  const nested = String(optionRow?.option?.title || optionRow?.title || "").trim();
  if (nested) {
    return nested;
  }
  const optionId = String(optionRow?.option_id || optionRow?.option?.id || "").trim();
  if (optionId && optionTitleById?.has(optionId)) {
    return optionTitleById.get(optionId) || "";
  }
  return "";
}

/**
 * Classify an option title as size, color, height, or other.
 * purpose --- قد/Height are selectable options; ارتفاع physical cm stays on variant attributes ---
 * @param {string} title
 * @returns {"size" | "color" | "height" | "other"}
 */
export function classifyOptionTitle(title) {
  const normalized = String(title || "").toLowerCase();
  if (
    normalized.includes("size") ||
    normalized.includes("سایز") ||
    normalized.includes("سايز")
  ) {
    return "size";
  }
  if (
    normalized.includes("color") ||
    normalized.includes("colour") ||
    normalized.includes("رنگ")
  ) {
    return "color";
  }
  if (
    normalized.includes("height") ||
    normalized.includes("قد") ||
    normalized.includes("length") ||
    normalized.includes("طول")
  ) {
    return "height";
  }
  return "other";
}

/**
 * Ordered option kinds from product.options (Size → قد → Color, …).
 * @param {object | null | undefined} product
 * @returns {Array<"size" | "color" | "height" | "other">}
 */
export function buildProductOptionKinds(product) {
  const options = Array.isArray(product?.options) ? product.options : [];
  return options.map((option) => classifyOptionTitle(option?.title));
}

/**
 * Read declared option values from product.options by kind.
 * @param {object | null | undefined} product
 * @param {"size" | "color" | "height" | "other"} kind
 * @returns {string[]}
 */
export function extractProductOptionValues(product, kind) {
  const options = Array.isArray(product?.options) ? product.options : [];
  /** @type {string[]} */
  const values = [];
  for (const option of options) {
    if (classifyOptionTitle(option?.title) !== kind) {
      continue;
    }
    const rows = Array.isArray(option?.values) ? option.values : [];
    for (const row of rows) {
      const value = String(row?.value || "").trim();
      if (value && !values.includes(value)) {
        values.push(value);
      }
    }
  }
  return values;
}

/**
 * Extra product options (not size/color/height) for dynamic PDP pickers.
 * @param {object | null | undefined} product
 * @returns {Array<{ title: string, values: string[] }>}
 */
export function extractExtraProductOptions(product) {
  const options = Array.isArray(product?.options) ? product.options : [];
  /** @type {Array<{ title: string, values: string[] }>} */
  const extras = [];
  for (const option of options) {
    const title = String(option?.title || "").trim();
    if (!title || classifyOptionTitle(title) !== "other") {
      continue;
    }
    const values = [];
    const rows = Array.isArray(option?.values) ? option.values : [];
    for (const row of rows) {
      const value = String(row?.value || "").trim();
      if (value && !values.includes(value)) {
        values.push(value);
      }
    }
    if (values.length > 0) {
      extras.push({ title, values });
    }
  }
  return extras;
}

/**
 * Parse "M / Black" or "M / 180 / Black" style variant titles.
 * @param {string} title
 * @returns {{ size: string, color: string, height: string } | null}
 */
export function parseVariantTitleOptions(title) {
  const raw = String(title || "").trim();
  if (!raw.includes(" / ")) {
    return null;
  }
  const parts = raw
    .split(" / ")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  if (parts.length === 2) {
    return {
      size: parts[0] || "One size",
      height: "",
      color: parts[1] || DEFAULT_COLOR_SENTINEL,
    };
  }
  // Three-or-more: first = size, last = color, middle joined = height/قد
  return {
    size: parts[0] || "One size",
    height: parts.slice(1, -1).join(" / "),
    color: parts[parts.length - 1] || DEFAULT_COLOR_SENTINEL,
  };
}

/**
 * Apply a classified option value onto the accumulator.
 * @param {"size" | "color" | "height" | "other"} kind
 * @param {string} value
 * @param {string} title
 * @param {{
 *   size: string,
 *   color: string,
 *   height: string,
 *   hasColorOption: boolean,
 *   hasSizeOption: boolean,
 *   hasHeightOption: boolean,
 *   extraOptions: Record<string, string>
 * }} state
 */
function applyOptionKind(kind, value, title, state) {
  if (!value) {
    return;
  }
  if (kind === "size") {
    state.hasSizeOption = true;
    state.size = value;
  } else if (kind === "color") {
    state.hasColorOption = true;
    state.color = value;
  } else if (kind === "height") {
    state.hasHeightOption = true;
    state.height = value;
  } else if (title) {
    state.extraOptions[title] = value;
  }
}

/**
 * Read size/color/height option values from a Medusa variant.
 * @param {object} variant
 * @param {Map<string, string>} [optionTitleById]
 * @param {{
 *   productColorValues?: string[],
 *   fallbackColor?: string | null,
 *   productOptionKinds?: Array<"size" | "color" | "height" | "other">
 * }} [context]
 * @returns {{
 *   size: string,
 *   color: string,
 *   height: string,
 *   hasColorOption: boolean,
 *   hasSizeOption: boolean,
 *   hasHeightOption: boolean,
 *   extraOptions: Record<string, string>
 * }}
 */
export function extractVariantOptions(variant, optionTitleById, context = {}) {
  const options = Array.isArray(variant?.options) ? variant.options : [];
  const state = {
    size: "",
    color: "",
    height: "",
    hasColorOption: false,
    hasSizeOption: false,
    hasHeightOption: false,
    /** @type {Record<string, string>} */
    extraOptions: {},
  };

  for (const option of options) {
    const title = resolveOptionTitle(option, optionTitleById);
    const value = String(option?.value || "").trim();
    if (!value) {
      continue;
    }
    applyOptionKind(classifyOptionTitle(title), value, title, state);
  }

  // Fill gaps using product.options order when nested titles are missing
  const productOptionKinds = Array.isArray(context.productOptionKinds)
    ? context.productOptionKinds
    : [];
  if (productOptionKinds.length > 0 && options.length > 0) {
    for (let index = 0; index < options.length; index += 1) {
      const kind = productOptionKinds[index];
      if (!kind || kind === "other") {
        continue;
      }
      const value = String(options[index]?.value || "").trim();
      if (!value) {
        continue;
      }
      if (kind === "size" && !state.hasSizeOption) {
        applyOptionKind("size", value, "", state);
      } else if (kind === "color" && !state.hasColorOption) {
        applyOptionKind("color", value, "", state);
      } else if (kind === "height" && !state.hasHeightOption) {
        applyOptionKind("height", value, "", state);
      }
    }
  }

  // Fallback when option titles are missing — common single-option size variants
  if (!state.size && !state.color && !state.height && options.length === 1) {
    const onlyTitle = resolveOptionTitle(options[0], optionTitleById);
    const onlyKind = classifyOptionTitle(onlyTitle);
    const onlyValue = String(options[0]?.value || variant?.title || "").trim();
    applyOptionKind(onlyKind === "other" ? "size" : onlyKind, onlyValue, onlyTitle, state);
  }

  // Exactly two unlabeled options: Size + Color (Medusa Admin default) OR Size + قد
  if (
    !state.hasSizeOption &&
    !state.hasColorOption &&
    !state.hasHeightOption &&
    options.length === 2
  ) {
    const first = String(options[0]?.value || "").trim();
    const second = String(options[1]?.value || "").trim();
    const kindsHint = productOptionKinds.slice(0, 2);
    if (kindsHint.includes("height") && !kindsHint.includes("color")) {
      state.hasSizeOption = true;
      state.hasHeightOption = true;
      state.size = first;
      state.height = second;
    } else {
      state.hasSizeOption = true;
      state.hasColorOption = true;
      state.size = first;
      state.color = second;
    }
  }

  // Title fallback: "S / Black" or "M / 180 / Black"
  if (
    (!state.size || !state.hasColorOption || !state.hasHeightOption) &&
    variant?.title
  ) {
    const parsed = parseVariantTitleOptions(variant.title);
    if (parsed) {
      const kindsKnown = productOptionKinds.length > 0;
      const allowsColorFromTitle =
        !kindsKnown || productOptionKinds.includes("color");
      const allowsHeightFromTitle =
        !kindsKnown || productOptionKinds.includes("height");

      if (!state.size) {
        state.size = parsed.size;
        state.hasSizeOption = true;
      }
      if (!state.hasHeightOption && parsed.height && allowsHeightFromTitle) {
        state.height = parsed.height;
        state.hasHeightOption = true;
      }
      if (
        !state.hasColorOption &&
        parsed.color !== DEFAULT_COLOR_SENTINEL &&
        allowsColorFromTitle
      ) {
        state.color = parsed.color;
        state.hasColorOption = true;
      }
      // Two-part "L / 175" with Size+قد (no Color): second segment is height, not color
      if (
        !parsed.height &&
        !state.hasHeightOption &&
        allowsHeightFromTitle &&
        !allowsColorFromTitle &&
        parsed.color &&
        parsed.color !== DEFAULT_COLOR_SENTINEL
      ) {
        state.height = parsed.color;
        state.hasHeightOption = true;
      }
    }
  }

  // Size-only variant while product declares Color value(s) → inherit fallback color
  const productColors = Array.isArray(context.productColorValues)
    ? context.productColorValues
    : [];
  const fallbackColor = context.fallbackColor || null;
  if (!state.hasColorOption && fallbackColor) {
    state.color = fallbackColor;
    state.hasColorOption = true;
  } else if (!state.hasColorOption && productColors.length === 1) {
    state.color = productColors[0];
    state.hasColorOption = true;
  }

  if (!state.size) {
    state.size = String(variant?.title || "One size").trim() || "One size";
  }
  if (!state.color) {
    state.color = DEFAULT_COLOR_SENTINEL;
  }

  return state;
}

/**
 * Resolve display price (IRT toman units as returned by Medusa calculated_amount).
 * Falls back to original_amount and prices[] when option-based variant pricing
 * leaves calculated_price incomplete on some rows.
 * @param {object} variant
 * @returns {number}
 */
export function extractVariantPrice(variant) {
  const tryAmount = (value) => {
    if (value === undefined || value === null) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const calculated = tryAmount(variant?.calculated_price?.calculated_amount);
  if (calculated !== null) {
    return calculated;
  }
  const original = tryAmount(variant?.calculated_price?.original_amount);
  if (original !== null) {
    return original;
  }

  const prices = Array.isArray(variant?.prices) ? variant.prices : [];
  for (const price of prices) {
    const amount = tryAmount(price?.amount);
    if (amount !== null) {
      return amount;
    }
  }
  return 0;
}

/**
 * Parse a single numeric/text attribute from a Medusa product or variant row.
 * @param {unknown} value
 * @returns {number | null}
 */
function parseAttributeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Physical / customs attributes from one Medusa product or variant row.
 * @param {object | null | undefined} source
 * @returns {{
 *   height: number | null,
 *   width: number | null,
 *   length: number | null,
 *   weight: number | null,
 *   hsCode: string,
 *   midCode: string,
 *   originCountry: string
 * }}
 */
export function extractSourceAttributes(source) {
  return {
    height: parseAttributeNumber(source?.height),
    width: parseAttributeNumber(source?.width),
    length: parseAttributeNumber(source?.length),
    weight: parseAttributeNumber(source?.weight),
    hsCode: String(source?.hs_code || "").trim(),
    midCode: String(source?.mid_code || "").trim(),
    originCountry: String(source?.origin_country || "").trim(),
  };
}

/**
 * Resolve available stock for a variant.
 * @param {object} variant
 * @returns {number}
 */
export function extractVariantStock(variant) {
  if (variant?.manage_inventory === false) {
    return 999;
  }
  if (variant?.inventory_quantity !== undefined && variant?.inventory_quantity !== null) {
    return Math.max(0, Number(variant.inventory_quantity) || 0);
  }
  // When inventory qty is not expanded, treat as available for browse UI
  return 10;
}

/**
 * Map one Medusa variant to Mashhoodwear variant row (+ Medusa ids).
 * @param {object} variant
 * @param {Map<string, string>} [optionTitleById]
 * @param {{
 *   productColorValues?: string[],
 *   fallbackColor?: string | null,
 *   productOptionKinds?: Array<"size" | "color" | "height" | "other">
 * }} [context]
 * @returns {{
 *   size: string,
 *   color: string,
 *   height: string,
 *   stock: number,
 *   variantId: string,
 *   price: number,
 *   hasColorOption: boolean,
 *   hasSizeOption: boolean,
 *   hasHeightOption: boolean,
 *   extraOptions: Record<string, string>,
 *   attributes: ReturnType<typeof extractSourceAttributes>
 * }}
 */
export function mapMedusaVariant(variant, optionTitleById, context = {}) {
  const {
    size,
    color,
    height,
    hasColorOption,
    hasSizeOption,
    hasHeightOption,
    extraOptions,
  } = extractVariantOptions(variant, optionTitleById, context);
  return {
    size,
    color,
    height,
    stock: extractVariantStock(variant),
    variantId: String(variant?.id || ""),
    price: extractVariantPrice(variant),
    hasColorOption,
    hasSizeOption,
    hasHeightOption,
    extraOptions,
    attributes: extractSourceAttributes(variant),
  };
}

/**
 * Whether the product declares or carries Height options.
 * @param {object | null | undefined} product
 * @param {Array<{ hasHeightOption?: boolean, height?: string }>} variants
 * @returns {boolean}
 */
export function productHasHeightOptions(product, variants) {
  const declared = extractProductOptionValues(product, "height");
  if (declared.length > 0) {
    return true;
  }
  return (variants || []).some(
    (row) => row.hasHeightOption || String(row.height || "").trim()
  );
}

/**
 * Whether the product declares or carries real Color options.
 * @param {object | null | undefined} product
 * @param {Array<{ hasColorOption?: boolean, color?: string }>} variants
 * @returns {boolean}
 */
export function productHasColorOptions(product, variants) {
  const declared = extractProductOptionValues(product, "color");
  if (declared.length > 0) {
    return true;
  }
  if (!Array.isArray(variants) || variants.length === 0) {
    return false;
  }
  if (variants.some((row) => row.hasColorOption)) {
    return true;
  }
  const colors = [
    ...new Set(variants.map((row) => String(row.color || "").trim()).filter(Boolean)),
  ];
  return colors.length > 1 || (colors.length === 1 && colors[0] !== DEFAULT_COLOR_SENTINEL);
}

/**
 * Colors to show in PDP / filters: declared product Color options ∪ colors on variants.
 * @param {object | null | undefined} product
 * @param {Array<{ color?: string, hasColorOption?: boolean }>} variants
 * @returns {string[]}
 */
export function collectDisplayColors(product, variants) {
  const declared = extractProductOptionValues(product, "color");
  const fromVariants = (variants || [])
    .map((row) => String(row.color || "").trim())
    .filter((color) => color && color !== DEFAULT_COLOR_SENTINEL);

  /** @type {string[]} */
  const merged = [];
  for (const color of [...declared, ...fromVariants]) {
    if (color && !merged.includes(color)) {
      merged.push(color);
    }
  }
  return merged;
}

/**
 * Map Medusa product → ProductItem (list card).
 * @param {object} product
 * @returns {import('../../types').ProductItem}
 */
export function mapMedusaProductToItem(product) {
  const optionTitleById = buildOptionTitleById(product);
  const productColorValues = extractProductOptionValues(product, "color");
  const productOptionKinds = buildProductOptionKinds(product);
  const fallbackColor = resolveSizeOnlyFallbackColor(productColorValues);
  const variants = Array.isArray(product?.variants)
    ? product.variants.map((variant) =>
        mapMedusaVariant(variant, optionTitleById, {
          productColorValues,
          fallbackColor,
          productOptionKinds,
        })
      )
    : [];
  const totalStock = variants.reduce((sum, row) => sum + row.stock, 0);
  const pricedAmounts = variants
    .map((row) => row.price)
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  const price =
    pricedAmounts.length > 0
      ? Math.min(...pricedAmounts)
      : extractVariantPrice(product?.variants?.[0]) || 0;
  const priceMax =
    pricedAmounts.length > 0 ? Math.max(...pricedAmounts) : price;
  const displayColors = collectDisplayColors(product, variants);
  const sizes = extractProductOptionValues(product, "size");
  for (const value of variants.map((row) => String(row.size || "").trim()).filter(Boolean)) {
    if (!sizes.includes(value)) {
      sizes.push(value);
    }
  }
  const heights = extractProductOptionValues(product, "height");
  const fromVariantHeights = variants
    .map((row) => String(row.height || "").trim())
    .filter(Boolean);
  for (const value of fromVariantHeights) {
    if (!heights.includes(value)) {
      heights.push(value);
    }
  }
  const extraOptions = extractExtraProductOptions(product);

  return {
    id: String(product?.id || ""),
    slug: String(product?.handle || ""),
    name: String(product?.title || ""),
    price,
    priceMax,
    imageUrl: resolveMedusaAssetUrl(
      product?.thumbnail || product?.images?.[0]?.url || null,
    ),
    variants,
    totalStock,
    stockLabel: buildStockLabel(totalStock),
    hasColorOptions: productHasColorOptions(product, variants),
    hasHeightOptions: productHasHeightOptions(product, variants),
    sizes,
    colors: displayColors,
    heights,
    extraOptions,
  };
}

/**
 * Map Medusa product → ProductDetail.
 * @param {object} product
 * @returns {import('../../types').ProductDetail}
 */
export function mapMedusaProductToDetail(product) {
  const item = mapMedusaProductToItem(product);
  const images = Array.isArray(product?.images)
    ? product.images.map((image) => resolveMedusaAssetUrl(image.url)).filter(Boolean)
    : [];
  if (item.imageUrl && !images.includes(item.imageUrl)) {
    images.unshift(item.imageUrl);
  }

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: String(product?.description || ""),
    price: item.price,
    priceMax: item.priceMax,
    status: item.totalStock <= 0 ? "out_of_stock" : "published",
    images: images.length > 0 ? images : item.imageUrl ? [item.imageUrl] : [],
    variants: item.variants,
    totalStock: item.totalStock,
    stockLabel: item.stockLabel,
    hasColorOptions: item.hasColorOptions,
    hasHeightOptions: item.hasHeightOptions,
    sizes: item.sizes,
    colors: item.colors,
    heights: item.heights,
    extraOptions: item.extraOptions,
    attributes: extractProductAttributes(product),
  };
}

/**
 * Physical / customs attributes from Medusa Admin «ویژگی‌ها».
 * Prefer first variant values when product-level fields are empty.
 * @param {object | null | undefined} product
 * @returns {ReturnType<typeof extractSourceAttributes>}
 */
export function extractProductAttributes(product) {
  const productAttrs = extractSourceAttributes(product);
  const firstVariant =
    Array.isArray(product?.variants) && product.variants.length > 0
      ? product.variants[0]
      : null;
  const variantAttrs = extractSourceAttributes(firstVariant);

  const pickNumber = (productValue, variantValue) =>
    productValue !== null ? productValue : variantValue;
  const pickText = (productValue, variantValue) =>
    productValue || variantValue || "";

  return {
    height: pickNumber(productAttrs.height, variantAttrs.height),
    width: pickNumber(productAttrs.width, variantAttrs.width),
    length: pickNumber(productAttrs.length, variantAttrs.length),
    weight: pickNumber(productAttrs.weight, variantAttrs.weight),
    hsCode: pickText(productAttrs.hsCode, variantAttrs.hsCode),
    midCode: pickText(productAttrs.midCode, variantAttrs.midCode),
    originCountry: pickText(productAttrs.originCountry, variantAttrs.originCountry),
  };
}

/**
 * Map Medusa category → CategoryItem.
 * @param {object} category
 * @param {number} [displayOrder]
 * @returns {import('../../types').CategoryItem}
 */
export function mapMedusaCategory(category, displayOrder = 0) {
  return {
    id: String(category?.id || ""),
    name: String(category?.name || ""),
    slug: String(category?.handle || ""),
    displayOrder,
  };
}

/**
 * Map Medusa collection → CollectionItem.
 * @param {object} collection
 * @param {number} [productCount]
 * @returns {import('../../types').CollectionItem}
 */
export function mapMedusaCollection(collection, productCount = 0) {
  const metadata = collection?.metadata && typeof collection.metadata === "object"
    ? collection.metadata
    : {};
  const coverFromMetadata =
    typeof metadata.cover_image_url === "string" ? metadata.cover_image_url : "";

  return {
    id: String(collection?.id || ""),
    name: String(collection?.title || ""),
    slug: String(collection?.handle || ""),
    coverImageUrl: resolveMedusaAssetUrl(coverFromMetadata || collection?.thumbnail || "") || "",
    description: String(metadata.description || ""),
    productCount,
  };
}
