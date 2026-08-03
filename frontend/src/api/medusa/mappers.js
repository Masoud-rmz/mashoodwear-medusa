/**
 * Map Medusa Store API products into Mashhoodwear UI shapes.
 * purpose --- keep existing React pages stable while commerce data comes from Medusa ---
 */
import { resolveSizeOnlyFallbackColor } from "../../utils/colorSwatches.js";

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
 * Parse "M / Black" style variant titles into size + color.
 * @param {string} title
 * @returns {{ size: string, color: string } | null}
 */
export function parseVariantTitleOptions(title) {
  const raw = String(title || "").trim();
  if (!raw.includes(" / ")) {
    return null;
  }
  const [sizePart, colorPart] = raw.split(" / ");
  const size = String(sizePart || "").trim();
  const color = String(colorPart || "").trim();
  if (!size && !color) {
    return null;
  }
  return {
    size: size || "One size",
    color: color || DEFAULT_COLOR_SENTINEL,
  };
}

/**
 * Read size/color/height option values from a Medusa variant.
 * @param {object} variant
 * @param {Map<string, string>} [optionTitleById]
 * @param {{ productColorValues?: string[], fallbackColor?: string | null }} [context]
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
  let size = "";
  let color = "";
  let height = "";
  let hasColorOption = false;
  let hasSizeOption = false;
  let hasHeightOption = false;
  /** @type {Record<string, string>} */
  const extraOptions = {};

  for (const option of options) {
    const title = resolveOptionTitle(option, optionTitleById);
    const value = String(option?.value || "").trim();
    if (!value) {
      continue;
    }
    const kind = classifyOptionTitle(title);
    if (kind === "size") {
      hasSizeOption = true;
      size = value;
    } else if (kind === "color") {
      hasColorOption = true;
      color = value;
    } else if (kind === "height") {
      hasHeightOption = true;
      height = value;
    } else if (title) {
      extraOptions[title] = value;
    }
  }

  // Fallback when option titles are missing — common single-option size variants
  if (!size && !color && !height && options.length === 1) {
    const onlyTitle = resolveOptionTitle(options[0], optionTitleById);
    const onlyKind = classifyOptionTitle(onlyTitle);
    const onlyValue = String(options[0]?.value || variant?.title || "").trim();
    if (onlyKind === "color") {
      hasColorOption = true;
      color = onlyValue;
    } else if (onlyKind === "height") {
      hasHeightOption = true;
      height = onlyValue;
    } else {
      hasSizeOption = true;
      size = onlyValue;
    }
  }

  // Two unlabeled options: first → size, second → color (Medusa Admin default order)
  if (!size && !color && options.length >= 2) {
    hasSizeOption = true;
    hasColorOption = true;
    size = String(options[0]?.value || "").trim();
    color = String(options[1]?.value || "").trim();
  }

  // Title fallback: "S / Black"
  if ((!size || !hasColorOption) && variant?.title) {
    const parsed = parseVariantTitleOptions(variant.title);
    if (parsed) {
      if (!size) {
        size = parsed.size;
        hasSizeOption = true;
      }
      if (!hasColorOption && parsed.color !== DEFAULT_COLOR_SENTINEL) {
        color = parsed.color;
        hasColorOption = true;
      }
    }
  }

  // Size-only variant while product declares Color value(s) → inherit fallback color
  const productColors = Array.isArray(context.productColorValues)
    ? context.productColorValues
    : [];
  const fallbackColor = context.fallbackColor || null;
  if (!hasColorOption && fallbackColor) {
    color = fallbackColor;
    hasColorOption = true;
  } else if (!hasColorOption && productColors.length === 1) {
    color = productColors[0];
    hasColorOption = true;
  }

  if (!size) {
    size = String(variant?.title || "One size").trim() || "One size";
  }
  if (!color) {
    color = DEFAULT_COLOR_SENTINEL;
  }

  return {
    size,
    color,
    height,
    hasColorOption,
    hasSizeOption,
    hasHeightOption,
    extraOptions,
  };
}

/**
 * Resolve display price (IRT toman units as returned by Medusa calculated_amount).
 * @param {object} variant
 * @returns {number}
 */
export function extractVariantPrice(variant) {
  const calculated = variant?.calculated_price?.calculated_amount;
  if (calculated !== undefined && calculated !== null && Number.isFinite(Number(calculated))) {
    return Number(calculated);
  }
  return 0;
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
 * @param {{ productColorValues?: string[] }} [context]
 * @returns {{
 *   size: string,
 *   color: string,
 *   stock: number,
 *   variantId: string,
 *   price: number,
 *   hasColorOption: boolean,
 *   hasSizeOption: boolean
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
  const fallbackColor = resolveSizeOnlyFallbackColor(productColorValues);
  const variants = Array.isArray(product?.variants)
    ? product.variants.map((variant) =>
        mapMedusaVariant(variant, optionTitleById, {
          productColorValues,
          fallbackColor,
        })
      )
    : [];
  const totalStock = variants.reduce((sum, row) => sum + row.stock, 0);
  const price =
    variants.find((row) => row.price > 0)?.price ??
    extractVariantPrice(product?.variants?.[0]) ??
    0;
  const displayColors = collectDisplayColors(product, variants);
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
    imageUrl: product?.thumbnail || product?.images?.[0]?.url || null,
    variants,
    totalStock,
    stockLabel: buildStockLabel(totalStock),
    hasColorOptions: productHasColorOptions(product, variants),
    hasHeightOptions: productHasHeightOptions(product, variants),
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
    ? product.images.map((image) => image.url).filter(Boolean)
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
    status: item.totalStock <= 0 ? "out_of_stock" : "published",
    images: images.length > 0 ? images : item.imageUrl ? [item.imageUrl] : [],
    variants: item.variants,
    totalStock: item.totalStock,
    stockLabel: item.stockLabel,
    hasColorOptions: item.hasColorOptions,
    hasHeightOptions: item.hasHeightOptions,
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
export function extractProductAttributes(product) {
  const firstVariant =
    Array.isArray(product?.variants) && product.variants.length > 0
      ? product.variants[0]
      : null;

  const pickNumber = (productValue, variantValue) => {
    const tryParse = (value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const fromProduct = tryParse(productValue);
    if (fromProduct !== null) {
      return fromProduct;
    }
    return tryParse(variantValue);
  };

  const pickText = (productValue, variantValue) => {
    const fromProduct = String(productValue || "").trim();
    if (fromProduct) {
      return fromProduct;
    }
    return String(variantValue || "").trim();
  };

  return {
    height: pickNumber(product?.height, firstVariant?.height),
    width: pickNumber(product?.width, firstVariant?.width),
    length: pickNumber(product?.length, firstVariant?.length),
    weight: pickNumber(product?.weight, firstVariant?.weight),
    hsCode: pickText(product?.hs_code, firstVariant?.hs_code),
    midCode: pickText(product?.mid_code, firstVariant?.mid_code),
    originCountry: pickText(product?.origin_country, firstVariant?.origin_country),
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
    coverImageUrl: coverFromMetadata || collection?.thumbnail || "",
    description: String(metadata.description || ""),
    productCount,
  };
}
